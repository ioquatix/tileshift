// Copyright (C) 2010 Samuel Williams. All Rights Reserved.

/// *** Tileshift Application Code ***
/// Contains global configuration and application code.
Tileshift = {
	levels: {},
	controller: null,
	
	addLevel: function(level) {
		this.levels[level.name] = level;
	},
	
	levelsByDifficulty: function() {
		var allLevels = [];
		
		for (var key in this.levels) {
			allLevels.push(this.levels[key]);
		}
		
		allLevels.sort(function(a, b) {a.difficulty < b.difficulty});
		
		return allLevels;
	},
	
	loadDefaultResources: function(resourceLoader) {
		resourceLoader.loadImage(Tile.FLOOR, 'tiles/Stone Block.png');
		resourceLoader.loadImage(Tile.WALL, 'tiles/Stone Block Tall.png');
		resourceLoader.loadImage(Tile.START, 'tiles/Wall Block.png');
		resourceLoader.loadImage(Tile.END, 'tiles/Wood Block.png');
		resourceLoader.loadImage(Widget.PLAYER, 'tiles/Character Cat Girl.png');
		resourceLoader.loadImage(Widget.CHEST, 'tiles/Chest Closed.png');
		resourceLoader.loadImage(Widget.KEY, 'tiles/Key.png');
		resourceLoader.loadImage(Widget.STAR, 'tiles/Star.png');
		resourceLoader.loadAudio(Event.CHEST, 'effects/Chest.wav');
		resourceLoader.loadAudio(Event.DAMAGE, 'effects/Damage.wav');
	},
	
	run: function(config) {
		if (this.controller) return;
		
		var canvas = document.getElementById('tileshift'), levels = [];
		
		if (config && config.levelName) {
			levels.push(this.levels[config.levelName]);
		} else {
			levels = this.levelsByDifficulty();
		}
		
		var controller = new Tileshift.Controller(canvas, levels);
		this.controller = controller;
		
		this.loadDefaultResources(controller.resources);
		
		// Once we have loaded all resources, start the game:
		controller.resources.loaded(controller.resetLevel.bind(controller));
		
		window.addEventListener('keydown', this.handleUserInput.bind(this), false);
	},
	
	handleUserInput: function(e) {
		if (!this.controller) return;
		
		switch (e.charCode ? e.charCode : e.keyCode) {
		case 37: //left arrow
			this.controller.handleEvent(Event.WEST); break;
		case 38: //top arrow
			this.controller.handleEvent(Event.NORTH); break;
		case 39: //right arrow
			this.controller.handleEvent(Event.EAST); break;
		case 40: //down arrow
			this.controller.handleEvent(Event.SOUTH); break;
		default:
			return;
		}
		
		event.stopPropagation();
	}
};

/// *** Tileshift Controller ***
/// This class is responsible for controlling high level game progress.
Tileshift.Controller = function(canvas, levels) {
	this.canvas = canvas;
	this.levels = levels;
	
	this.maximumLives = 5;
	
	this.currentLevel = null;
	this.resources = new ResourceLoader();
	
	this.resetGame();
}

Tileshift.Controller.prototype.finishLevel = function() {
	if (this.currentLevel) {
		this.currentLevel.onFinish();
		this.currentLevel = null;
	}
}

Tileshift.Controller.prototype.resetGame = function() {
	this.lives = 1;
	
	this.score = 0;
	
	this.currentLevelIndex = 0;
}

Tileshift.Controller.prototype.resetLevel = function() {
	this.finishLevel();
	
	if (this.levels[this.currentLevelIndex]) {
		this.levels[this.currentLevelIndex].start(this);
	}
}

Tileshift.Controller.prototype.handleEvent = function(event) {
	if (this.currentLevel) {
		this.currentLevel.onUserEvent(event);
	}
}

Tileshift.Controller.prototype.runLevel = function(level) {
	this.currentLevel = level;
	level.onBegin();
}

Tileshift.Controller.prototype.updateScore = function(amount) {
	this.score += amount;
}

Tileshift.Controller.prototype.updateLives = function(amount) {
	this.lives += amount;
	
	if (this.lives > this.maximumLives) {
		this.lives = this.maximumLives;
	} else if (this.lives < 0) {
		this.lives = 0;
		
		return false;
	}
	
	return true;
}

Tileshift.Controller.prototype.levelCompleted = function() {
	this.currentLevelIndex = (this.currentLevelIndex + 1) % this.levels.length;
	
	this.resetLevel();
}

Tileshift.Controller.prototype.restartGame = function() {
	this.resetGame();
	this.resetLevel();
}

Tileshift.Controller.prototype.levelFailed = function() {
	this.finishLevel();
	
	if (this.lives > 0) {
		this.updateLives(-1);
		setTimeout(this.resetLevel.bind(this), 1000);
	} else {
		setTimeout(this.restartGame.bind(this), 1000);
	}
}

Tileshift.Controller.prototype.resizeCanvas = function(pixelSize) {
	// Set coordinate size:
	this.canvas.width = pixelSize[1];
	this.canvas.height = pixelSize[0];

	// Set element size:
	this.canvas.style.width = pixelSize[1] + 'px';
	this.canvas.style.height = pixelSize[0] + 'px';
}

/// *** enum Event ***
/// Contains functionality related to user input and game events.

// A list of possible user events:
Event = {
	NONE: 0,
	NORTH: 1,
	EAST: 2,
	SOUTH: 3,
	WEST: 4
};

Event.KEY = 'Event.KEY';
Event.DOOR = 'Event.DOOR';
Event.CHEST = 'Event.CHEST';
Event.STAR = 'Event.STAR';
Event.DAMAGE = 'Event.DAMAGE';

// Get the Row column displacement for the given Event type.
Event.displacement = function(e) {
	switch(e) {
	case Event.NORTH:
		return [-1, 0];
	case Event.EAST:
		return [0, 1];
	case Event.SOUTH:
		return [1, 0];
	case Event.WEST:
		return [0, -1];
	}
	
	return [0, 0];
}

/// *** class GameState ***
/// Manages the user location and other 
function GameState(map, location) {
	this.map = map;
	this.playerLocation = location;
	this.events = [[Event.NONE, location]];
	
	this.widgets = {};
}

GameState.prototype.pushEvent = function(event) {
	this.playerLocation = Vec2.add(this.playerLocation, Event.displacement(event));
	
	// Track the event that occured and the position after the event was applied:
	this.events.push([event, this.playerLocation.slice(0)]);
}

GameState.prototype.isValidEvent = function(event) {
	var location = Vec2.add(this.playerLocation, Event.displacement(event)),
		tile = this.map.get(location);
	
	return tile && !tile.blocked();
}

GameState.prototype.get = function(coordinate) {
	if (Vec2.equals(coordinate, this.playerLocation)) {
		return new Widget(0, Widget.PLAYER);
	} else {
		return this.widgets[coordinate];
	}
}

// Display the grid on a canvas object
function ControllerRenderer (resources, size, scale) {
	this.size = size;
	this.scale = scale || [40, 50];
	this.resources = resources;
}

ControllerRenderer.prototype.pixelSize = function(context) {
	return [this.scale[0] * 1.6, context.canvas.width];
}

ControllerRenderer.prototype.display = function (context, controller, bag) {
	var lives = controller.lives, score = controller.score;
	
	var pixelSize = this.pixelSize(context);
	
	var backgroundStyle = context.createLinearGradient(0, 10, 0, pixelSize[0] - 20);
	backgroundStyle.addColorStop(0, 'rgba(150, 200, 255, 0.95)');
	backgroundStyle.addColorStop(1, 'rgba(150, 200, 255, 0.4)');
	
	context.strokeStyle = '#aaaaff';
	context.fillStyle = backgroundStyle;
	
	roundedRectPath(context, 10, 10, pixelSize[1] - 20, pixelSize[0] - 20, 5);
	context.fill();
	context.stroke();
	
	context.fillStyle = 'white';
	context.font = 'italic bold 30px sans-serif';
	context.textBaseline = 'bottom';
	context.fillText('Score: ' + score, 30, 50);
	
	context.save();
	var image = this.resources.get(Widget.STAR);
	for (var i = 0; i < controller.maximumLives; i += 1) {
		if (i >= controller.lives) {
			context.globalCompositeOperation = "lighter";
			context.globalAlpha = 0.2;
		}
		
		context.drawImage(image, pixelSize[1] - (this.scale[1] * (i + 1.5) * 0.8), -6, image.width * 0.74, image.height * 0.74);
	}
	context.restore();
	
	var i = 0;
	for (var key in bag) {
		var item = bag[key];
		
		var image = this.resources.get(item.identity);
		
		if (image) {
			context.drawImage(image, (pixelSize[1] / 3.0) + (this.scale[1] * (i + 1.5) * 0.8), -6, image.width * 0.74, image.height * 0.74);
			
			i += 1;
		}
	}
}
