// Copyright (C) 2010 Samuel Williams. All Rights Reserved.

function Vec2 (x, y) {
	this.x = x;
	this.y = y;
}

Vec2.get = function(input) {
	if (input instanceof Vec2)
		return input;
	else
		return new Vec2(input[0], input[1]);
}

Vec2.equals = function(left, right) {
	return (left[0] == right[0]) && (left[1] == right[1]);
}

Vec2.euclidianDistance = function(left, right) {
	var dx = left[0] - right[0], dy = left[1] - right[1];
	return Math.sqrt(dx*dx + dy*dy);
}

Vec2.manhattenDistance = function(left, right) {
	var dx = left[0] - right[0], dy = left[1] - right[1];
	return Math.abs(dx) + Math.abs(dy);
}

Platform = {
	NONE: 0,
	FLOOR: 1,
	WALL: 2,
	START: 3
};

// Tile class
function Tile (cost, platform, special) {
	this.cost = cost;
	this.special = special;
	
	this.platform = platform;
}

function ResourceLoader () {
	this.resources = {};
	this.callback = null;
	this.counter = 0;
}

ResourceLoader.prototype.loadImage = function (name, src) {
	this.counter += 1;
	var img = new Image();
	this[name] = img;
	
	var that = this;
	img.onload = function() {
		that.counter -= 1;
			
		if (that.counter == 0) {
			that.callback(that);
		}
	};
	
	img.src = src;
}

ResourceLoader.prototype.loaded = function (callback) {
	this.callback = callback;

	if (this.counter == 0) {
		callback(this);
	}
}

Tile.START = 1;
Tile.END = 2;
Tile.IMG = new ResourceLoader();
Tile.IMG.loadImage(Platform.FLOOR, 'tiles/Stone Block.png');
Tile.IMG.loadImage(Platform.WALL, 'tiles/Stone Block Tall.png');
Tile.IMG.loadImage(Platform.START, 'tiles/Wall Block.png');
Tile.IMG.loadImage('PLAYER', 'tiles/Character Cat Girl.png');
Tile.IMG.loadImage('END', 'tiles/Chest Closed.png');

Tile.prototype.blocked = function () {
	return this.cost == -1;
}

Tile.prototype.setSpecial = function (special) {
	this.special = special;
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
}

TileMap.prototype.duplicate = function() {
	var map = new TileMap(this.size);
	map.edges = this.edges.slice(0);
	
	return map;
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
			specials.push([[r, c], tile])
		}
	}
	
	return specials;
}

//Event enum type
Event = {
	NONE: 0,
	NORTH: 1,
	EAST: 2,
	SOUTH: 3,
	WEST: 4
};

//Get the Row column displacement for the given Event type.
Event.displacement = function(e){
	var displacement;
	switch(e)
	{
	case Event.NORTH:
		displacement = new Vec2(-1,0);
		break;
	case Event.EAST:
		displacement = new Vec2(0,1);
		break;
	case Event.SOUTH:
		displacement = new Vec2(1,0);
		break;
	case Event.WEST:
		displacement = new Vec2(0,-1);
		break;
	default:

	}
	return displacement;
}

//Game State class
function GameState(initialWorld, initialLocation) {
	this.world = initialWorld;
	this.events = [[Event.None, initialLocation]];
	this.currentPos = initialLocation;
}

GameState.prototype.pushEvent = function(event) {
	var displace = Event.displacement(event);
	
	this.currentPos[0] += displace.x;
	this.currentPos[1] += displace.y;
	
	// Track the event that occured and the position after the event was applied:
	this.events.push([event, this.currentPos.slice(0)]);
}

GameState.prototype.getCurrentPos = function() {
	return this.currentPos;
}
GameState.prototype.getWidgets = function(pos) {
	if(pos[0] == this.currentPos[0] && pos[1] == this.currentPos[1]){
		return Tile.IMG.PLAYER;
	}
	
	return;
}

TileMap.prototype.beginSearch = function(pathFinder) {
	var start = this.getSpecials(Tile.START)[0];
	var end = this.getSpecials(Tile.END)[0];
	
	if (start && end) {
		var estimate = this.estimatePathCost(start[0], end[0]);
		pathFinder.addStep(null, start[0], 0, estimate);
	}
}

function TileMapSearch(map, goals) {
	this.map = map;
	this.goals = goals;
}

// PathFinder delegates
TileMapSearch.P = [[-1, 0], [1, 0], [0, -1], [0, 1]];

TileMapSearch.prototype.addStepsFrom = function (pathFinder, node) {
	var goal = this.goals[0];
	
	for (var i = 0; i < TileMapSearch.P.length; i++) {
		var step = node.step;
		var next = [step[0] + TileMapSearch.P[i][0], step[1] + TileMapSearch.P[i][1]];
		var tile = this.map.get(next);
		
		if (tile) {
			var estimateToGoal = this.estimatePathCost(next, goal);
			pathFinder.addStep(node, next, 0.95, estimateToGoal);
		}
	}
}

TileMapSearch.prototype.estimatePathCost = function (fromNode, toNode) {
	//return Vec2.euclidianDistance(toNode, fromNode) * 2;
	return Vec2.manhattenDistance(toNode, fromNode) * 1.2;
}

TileMapSearch.prototype.exactPathCost = function (fromNode, toNode) {
	
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

function randomInt(max) {
	return Math.floor(Math.random() * max)
}

function Generator (map, events) {
	this.map = map;
	this.events = events;
	this.currentPosition = events[events.length - 1][1];
}

Generator.prototype.mutate = function () {
	var map = this.map.duplicate();
	
	for (var i = 0; i < 4; i++) {
		var r = randomInt(11) - 5, c = randomInt(11) - 5;
		
		r += this.currentPosition[0];
		c += this.currentPosition[1];

		if (r < 1) r = 1;
		if (c < 1) c = 1;
		if (r > map.size[0]-1) r = map.size[0]-2;
		if (c > map.size[1]-1) c = map.size[1]-2;

		if (map.get([r, c]) == null) {
			map.set([r, c], new Tile(0, Platform.FLOOR));
		}
	}
	
	return [this.score(map), map]
}

Generator.prototype.score = function (map) {
	var goals = map.getSpecials(Tile.END);
	
	var delegate = new TileMapSearch(map, [goals[0][0]]);
	var search = new PathFinder(delegate), worst = map.size[0] + map.size[1];
	
	delegate.prime(search, this.currentPosition);
	
	// Try the worst number iterations to find a path:
	search.update(worst);
	
	// Save first search for debugging purposes:
	if (!this.search) {
		this.search = search;
	}
	
	var best = search.currentBest();
	//console.log('candidate', best.cost(), goals[0][0], best.costFromStart, best.costToGoal, best.step, search);
	return best;
}

Generator.prototype.evolve = function (iterations) {
	var candidates = new BinaryHeap(function(candidate){
		return candidate[0].cost();
	});
	
	candidates.push([this.score(this.map), this.map])
	
	for (var i = 0; i < iterations; i += 1) {
		var permutation = this.mutate();
		candidates.push(permutation);
	}
	
	var best = candidates.pop();
	
	//console.log('selected', best[0].step, best[0], best[1]);
	
	return best[1];
}

// Display the grid on a canvas object
function TileMapRenderer () {
	this.scale = [40, 50];
}

TileMapRenderer.prototype.pixelSize = function (grid) {
	return [grid.size[0] * this.scale[0], grid.size[1] * this.scale[1]];
}

TileMapRenderer.prototype.updateCanvasSize = function (grid, canvasElement) {
	var pixelSize = this.pixelSize(grid);
	
	// Set coordinate size
	canvasElement.width = pixelSize[1];
	canvasElement.height = pixelSize[0];

	// Set element size
	canvasElement.style.width = pixelSize[1] + 'px'
	canvasElement.style.height = pixelSize[0] + 'px'
}

TileMapRenderer.prototype.display = function (context, grid, widgets) {
	var s = this.pixelSize(grid);
	
	var backgroundStyle = context.createLinearGradient(0, 0, 0, s[1]);
	backgroundStyle.addColorStop(0, '#000000');
	backgroundStyle.addColorStop(1, '#000000');
	
	context.fillStyle = backgroundStyle;
	context.fillRect(0, 0, grid.size[1] * this.scale[1], grid.size[0] * this.scale[0]);
	
	for (var r = 0; r < grid.size[0]; r += 1) {
		for (var c = 0; c < grid.size[1]; c += 1) {
			var tile = grid.get([r, c]);
			if (tile) {
				var fillStyle = null, strokeStyle = null;
					
				if (tile.platform != Platform.NONE) {
					var image = Tile.IMG[tile.platform]
					
					offset = (this.scale[0] - image.height);
					
					if (image) {
						context.drawImage(image, c*this.scale[1], r*this.scale[0] + offset);
					}
				}
				
				if (tile.special == Tile.END) {
					var image = Tile.IMG.END;
					
					offset = (this.scale[0] - image.height) - this.scale[0] / 2;
					
					context.drawImage(image, c*this.scale[1], r*this.scale[0] + offset);
				}
			}
			
			var widget = widgets.getWidgets([r,c]);
			if (widget) {
				var offset = (this.scale[0] - widget.height - this.scale[0] / 4);
				if (widget) {
					context.drawImage(widget, c*this.scale[1], r*this.scale[0] + offset);
				}
			}
		}
	}
}

var maze = document.getElementById('tileshift');
var map = null;

var mapRenderer = new TileMapRenderer();
var searchRenderer = new SearchRenderer(mapRenderer.scale);
var gameState = new GameState(map, [1, 1]);

function resetGame() {
	map = new TileMap([20, 30]);
	map.set([1, 1], new Tile(0, Platform.START))
	map.set([18, 28], new Tile(0, Platform.FLOOR, Tile.END));

	mapRenderer.updateCanvasSize(map, maze);

	gameState = new GameState(map, [1, 1]);
}

function updateWorld () {
	var generator = new Generator(map, gameState.events);
	map = generator.evolve(10);
	searchRenderer.search = generator.search;
	//console.log('search', generator.search);
	
	gameState.world = map;
	
	redraw();
}

function isValidEvent(event) {
	var temp = gameState.currentPos.slice(0);
	var displace = Event.displacement(event);
	temp[0] += displace.x;
	temp[1] += displace.y;
	var tile = map.get(temp);
	return tile && tile.blocked() != -1;
}

function handleUserInput (e) {
	var keyValue = e.charCode ? e.charCode : e.keyCode;
	switch (keyValue) {
	case 37: //left arrow
		if (isValidEvent(Event.WEST)) gameState.pushEvent(Event.WEST);
		break;
	case 38: //top arrow
		if (isValidEvent(Event.NORTH)) gameState.pushEvent(Event.NORTH);
		break
	case 39: //right arrow
		if (isValidEvent(Event.EAST)) gameState.pushEvent(Event.EAST);
		break;
	case 40: //down arrow
		if (isValidEvent(Event.SOUTH)) gameState.pushEvent(Event.SOUTH);
		break;
	}
	
	if (Vec2.equals(gameState.getCurrentPos(), [18, 28])) {
		resetGame();
	}
	
	redraw();
}

window.addEventListener('keydown', handleUserInput, false);

var visualiseDebug = false;

function redraw() {
	// Check the element is in the DOM and the browser supports canvas
	if(maze.getContext) {
	// Initaliase a 2-dimensional drawing context
		var context = maze.getContext('2d');
		mapRenderer.display(context, map, gameState);
		
		if (visualiseDebug) {
			searchRenderer.display(context);
		}
	}
}

function toggleDebugVisualisation(event) {
	visualiseDebug = event.target.checked;
}

Tile.IMG.loaded(function(loader) {
	resetGame();
	
	redraw();
	
	updateWorld();
	
	setInterval(function() {
		updateWorld();
	}, 500);
});
