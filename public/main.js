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

Vec2.prototype.equals = function(other) {
	return this.x === other.x && this.y === other.y;
}

Platform = {
	NONE: 0,
	FLOOR: 1,
	WALL: 2
}

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
Tile.IMG.loadImage('OPEN', 'open.png');
Tile.IMG.loadImage('CLOSED', 'closed.png');
Tile.IMG.loadImage('FINISH', 'finish.png');
Tile.IMG.loadImage(Platform.FLOOR, 'tiles/Stone Block.png');
Tile.IMG.loadImage(Platform.WALL, 'tiles/Stone Block Tall.png');
Tile.IMG.loadImage('PLAYER', 'tiles/Character Cat Girl.png');

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
		displacement = new Vec2(1,0);
		break;
	case Event.EAST:
		displacement = new Vec2(0,1);
		break;
	case Event.SOUTH:
		displacement = new Vec2(-1,0);
		break;
	case Event.WEST:
		displacement = new Vec2(0,-1);
		break;
	default:

	}
	return displacement;
}

//Game State class
function GameState( initialWorld, initialLocation) {
	this.world = initialWorld;
	this.events = [[Event.None],[initialLocation]];
	this.currentPos = initialLocation;
}

GameState.prototype.pushEvent = function(event) {
	this.currentPos += Event.displacement(event);
	this.events.push(event);
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

// PathFinder delegates
TileMap.P = new Array([-1, 0], [1, 0], [0, -1], [0, 1]);
TileMap.D = new Array([-1, -1], [-1, 1], [1, 1], [1, -1]);

TileMap.prototype.addStepsFrom = function (pathFinder, node) {
	var end = this.getSpecials(Tile.END)[0];
	
	for (var i = 0; i < TileMap.P.length; i++) {
		var step = node.step;
		var next = [step[0] + TileMap.P[i][0], step[1] + TileMap.P[i][1]];
		var tile = this.get(next);
			
		if (tile) {
			var estimateToGoal = this.estimatePathCost(next, end[0]);
			pathFinder.addStep(node, next, 0.6, estimateToGoal);
		}
	}

	for (var i = 0; i < TileMap.D.length; i++) {
		var step = node.step;
		var p = TileMap.D[i];
		var next = [step[0] + p[0], step[1] + p[1]];
			
		var tile = this.get(next);
			
		if (tile) {
			if (this.get([step[0] + p[0], step[1]]) || this.get([step[0], step[1] + p[1]])) {
			var estimateToGoal = this.estimatePathCost(next, end[0]);
			pathFinder.addStep(node, next, 0.9, estimateToGoal);
			}
		}
	}
}

TileMap.prototype.estimatePathCost = function (fromNode, toNode) {
	var d = [toNode[0] - fromNode[0], toNode[1] - fromNode[1]];
	return Math.sqrt(d[0]*d[0] + d[1]*d[1]);
}

TileMap.prototype.exactPathCost = function (fromNode, toNode) {
	
	}

TileMap.prototype.isGoalState = function (node) {
	var end = this.getSpecials(Tile.END);
	
	for (var i = 0; i < end.length; i++) {
	var endVec = Vec2.get(end[i][0]), stepVec = Vec2.get(node.step);
		
	if (endVec.equals(stepVec))
		return true;
	}
	
	return false;
}

TileMap.prototype.beginSearch = function(pathFinder) {
	var start = this.getSpecials(Tile.START)[0];
	var end = this.getSpecials(Tile.END)[0];
	
	if (start && end) {
	var estimate = this.estimatePathCost(start[0], end[0]);
		
	pathFinder.addStep(null, start[0], 0, estimate);
	}
}

function randomInt(max) {
	return Math.floor(Math.random() * max)
}

function Generator (map, events) {
	this.map = map;
	this.events = events;
	
	this.startingPosition = this.events
}

Generator.prototype.mutate = function () {
	var map = this.map.duplicate();
	
	for (var i = 0; i < 5; i++) {
		var r = randomInt(map.size[0]), c = randomInt(map.size[1]);

		if (r == 0) r++;
		if (c == 0) c++;
		if (r == map.size[0]-1) r = map.size[0]-2;
		if (c == map.size[1]-1) c = map.size[1]-2;

		map.set([r, c], new Tile(0, Platform.FLOOR));
	}
	
	return [this.score(map), map]
}

Generator.prototype.score = function () {
	return 10;
}

Generator.prototype.evolve = function (iterations) {
	var candidates = new BinaryHeap(function(candidate){
		return candidate[0];
	});
	
	for (var i = 0; i < iterations; i += 1) {
		candidates.push(this.mutate());
	}
	
	return candidates.pop()[1];
}

// Display the grid on a canvas object
function TileMapRenderer () {
	this.scale = [80, 100];
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
					
				console.log("Rendering tile", tile)
				if (tile.platform != Platform.NONE) {
					image = Tile.IMG[tile.platform]
					
					offset = (this.scale[0] - image.height);
					
					if (image) {
						context.drawImage(image, c*this.scale[1], r*this.scale[0] + offset);
					}
				}
			
			
			}
			
			var widget = widgets.getWidgets([r,c]);
			if (widget) {
				offset = (this.scale[0] - widget.height - 20);
				if (widget) {
					context.drawImage(widget, c*this.scale[1], r*this.scale[0] + offset);
				}
			}
		}
	}
}

var maze = document.getElementById('tileshift');
var map = new TileMap([10, 15]);

var mapRenderer = new TileMapRenderer();
mapRenderer.updateCanvasSize(map, maze);

var gameState = new GameState(map, [1,1]);

function updateSearch () {
	var generator = new Generator(map);
	map = generator.evolve(5);
	
	redraw();
}

function handleUserInput (e) {
	var keyValue = e.charCode ? e.charCode : e.keyCode;
	switch(keyValue){
	case 37: //left arrow
		GameState.pushEvent(Event.WEST);
		break;
	case 38: //top arrow
		GameState.pushEvent(Event.NORTH);
		break
	case 39: //right arrow
		GameState.pushEvent(Event.EAST);
		break;
	case 40: //down arrow
		GameState.pushEvent(Event.SOUTH);
		break;
	}
	
	redraw();
}

window.addEventListener('keydown', handleUserInput, false);
	
function redraw() {
	// Check the element is in the DOM and the browser supports canvas
	if(maze.getContext) {
	// Initaliase a 2-dimensional drawing context
		var context = maze.getContext('2d');
		mapRenderer.display(context, map, gameState);
	}
}

Tile.IMG.loaded(function(loader) {
	redraw();
});
