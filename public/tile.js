
/// *** class Tile ***
/// This class is used for representing a single 2D tile on the TileMap.
function Tile (cost, identity, special) {
	this.cost = cost;
	this.special = special;
	
	this.identity = identity;
	this.offset = 0;
}

Tile.prototype.blocked = function () {
	return this.cost == -1;
}

Tile.prototype.setSpecial = function (special) {
	this.special = special;
}

/// Basic platform constants, used for the Tile.identity.
Tile.FLOOR = 'Tile.FLOOR';
Tile.WALL = 'Tile.WALL';
Tile.START = 'Tile.START';
Tile.END = 'Tile.END';

Tile.WATER = 'Tile.WATER';
Tile.DIRT = 'Tile.DIRT';

// Legacy - please delete once done merging.
Platform = Tile;

/// *** class Widget ***
/// This class represents something sitting on top of a tile.
function Widget (cost, identity) {
	this.cost = cost;
	this.identity = identity;
	this.offset = -40;
}

Widget.prototype.blocked = function () {
	return this.cost == -1;
}

Widget.PLAYER = 'Widget.PLAYER';
Widget.CHEST = 'Widget.CHEST';
Widget.KEY = 'Widget.KEY';
Widget.DOOR = 'Widget.DOOR';
Widget.STAR = 'Widget.STAR';

/// *** Widget Layer ***
Widget.Layer = function() {
}

Widget.Layer.prototype.set = function(coordinate, widget) {
	this[coordinate] = widget;
}

Widget.Layer.prototype.get = function(coordinate) {
	return this[coordinate];
}

Widget.Layer.prototype.remove = function(coordinate) {
	delete this[coordinate];
}

Widget.Layer.prototype.move = function(from, to) {
	var widget = this[from];
	
	if (!this.get(to)) {
		this.remove(from);
		this.set(to, widget);
	}
}

Widget.Layer.prototype.duplicate = function() {
	var copy = new Widget.Layer();
	
	for (var key in this) {
		if (this.hasOwnProperty(key)) {
			copy[key] = this[key];
		}
	}
	
	return copy;
}

Widget.Layer.prototype.allLocations = function() {
	var locations = [];
	
	for (var key in this) {
		if (this.hasOwnProperty(key)) {
			locations.push(convertLocationKey(key));
		}
	}
	
	return locations;
}

// TileMap data model - contains tiles.
function TileMap (size, edges) {
	// [rows, cols]
	this.size = size;
	
	if (edges) {
		this.edges = edges.splice(0);
	} else {
		this.edges = new Array(size[0] * size[1]);
	}
	
	this.layers = {};
}

TileMap.prototype.duplicate = function() {
	var copy = new TileMap(this.size);
	
	for (var key in this.layers) {
		copy.layers[key] = this.layers[key].duplicate();
	}
	
	copy.edges = this.edges.slice(0);
	
	return copy;
}

TileMap.prototype.set = function (at, value) {
	this.edges[at[1] + at[0] * this.size[1]] = value;
}

TileMap.prototype.get = function (at) {
	if (at[0] < 0 || at[0] >= this.size[0] || at[1] < 0 || at[1] >= this.size[1])
		return;
	
	return this.edges[at[1] + at[0] * this.size[1]];
}

TileMap.prototype.getSpecials = function (special) {
	var specials = [];
	
	for (var r = 0; r < this.size[0]; r += 1) {
		for (var c = 0; c < this.size[1]; c += 1) {
			var tile = this.get([r, c]);
				
			if (tile && tile.special == special)
				specials.push([r, c]);
		}
	}
	
	return specials;
}

function TileMapSearch(map, goals) {
	this.map = map;
	this.goals = goals;
	
	this.distanceFunction = Vec2.manhattanDistance;
}

TileMapSearch.prototype.addStepsFrom = function (pathFinder, node) {
	var goal = this.goals[0], P = Vec2.P;
	
	for (var i = 0; i < P.length; i++) {
		var step = node.step;
		var next = [step[0] + P[i][0], step[1] + P[i][1]];
		var tile = this.map.get(next);
		
		// This approach adds a step based on the minimum cost for all goals:
		if (tile && !tile.blocked()) {
			var minimumEstimate = Infinity;
			
			for (var j in this.goals) {
				var estimateToGoal = this.estimatePathCost(next, this.goals[j]);
				
				if (estimateToGoal < minimumEstimate)
					minimumEstimate = estimateToGoal;
			}
			
			pathFinder.addStep(node, next, 1.0, minimumEstimate);
		}
	}
}

TileMapSearch.prototype.estimatePathCost = function (fromNode, toNode) {
	// This is carefully selected:
	return this.distanceFunction(toNode, fromNode) * 1.05;
}

TileMapSearch.prototype.isGoalState = function (node) {
	for (var i = 0; i < this.goals.length; i++) {
		if (Vec2.equals(this.goals[i], node.step))
			return true;
	}
	
	return false;
}

TileMapSearch.prototype.prime = function(search, start) {
	var goal = this.goals[0];
	
	// Estimate the cost to the goal:
	var estimate = this.estimatePathCost(start, goal);
	
	// Initial step:
	search.addStep(null, start, 0, estimate);
}

// Display the grid on a canvas object
function TileMapRenderer (resources, size, scale) {
	this.size = size;
	
	this.scale = scale || [80, 100];
	this.resources = resources;
}

TileMapRenderer.prototype.pixelSize = function() {
	return [(this.size[0] + 1.5) * this.scale[0], this.size[1] * this.scale[1]];
}

TileMapRenderer.prototype.display = function (context, layers) {
	var pixelSize = this.pixelSize();
	/*
	var backgroundStyle = context.createLinearGradient(0, 0, 0, pixelSize[1]);
	backgroundStyle.addColorStop(0, '#000000');
	backgroundStyle.addColorStop(1, '#333333');
	
	context.fillStyle = backgroundStyle;
	*/
	context.fillStyle = 'black';
	context.fillRect(0, 0, pixelSize[1], pixelSize[0]);
	
	for (var r = 0; r < this.size[0]; r += 1) {
		for (var c = 0; c < this.size[1]; c += 1) {
			var coordinate = [r, c];
			
			for (var i in layers) {
				var layer = layers[i],
					tile = layer.get(coordinate);
				
				if (tile) {
					var image = this.resources.get(tile.identity);
					
					if (image) {
						offset = (this.scale[0] - image.height) + tile.offset;
						context.drawImage(image, c*this.scale[1], (r+1)*this.scale[0] + offset);
					}
				}
			}
		}
	}
}
