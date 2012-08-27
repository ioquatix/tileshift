
Tileshift.addLevel({
	name: 'hearts',
	difficulty: 0.0,
	
	randomFloorMutation: function(generator, map) {
		for (var i = 0; i < 4; i++) {
			var r = randomInt(11) - 5, c = randomInt(11) - 5;

			r += generator.currentPosition[0];
			c += generator.currentPosition[1];

			if (r < 1) r = 1;
			if (c < 1) c = 1;
			if (r > map.size[0]-1) r = map.size[0]-2;
			if (c > map.size[1]-1) c = map.size[1]-2;

			if (map.get([r, c]) == null) {
				map.set([r, c], new Tile(0, Platform.DIRT));
			}
		}
	},

	randomFloorDestruction: function(generator, map) {
		for (var i = 0; i < 4; i++) {
			var r = randomInt(map.size[0]), c = randomInt(map.size[1]);

			var tile = map.get([r, c]);

			if (tile && !tile.special) {
				map.set([r, c], null);
			}
		}
	},

	randomStarMutation: function(generator, map) {
		if (randomInt(10) < 5) return;
		
		var r = randomInt(11) - 5, c = randomInt(11) - 5;

		r += generator.currentPosition[0];
		c += generator.currentPosition[1];

		var tile = map.get([r, c]);
		
		if (tile) {
			map.layers.stars[[r, c]] = new Widget(0, Widget.STAR);
		}
	},
	
	Level: function(config, controller) {
		this.resources = new ResourceLoader(controller.resources);
		
		this.onStart = function() {
			var map = new TileMap([20, 30]);
			map.set([1, 1], new Tile(0, Tile.START))
			map.set([18, 28], new Tile(0, Tile.FLOOR, Tile.END));

			map.layers.stars = new Widget.Layer();

			this.mapRenderer = new TileMapRenderer(this.resources, map.size);
			controller.resizeCanvas(this.mapRenderer.pixelSize());

			this.searchRenderer = new SearchRenderer(this.mapRenderer.scale);
			this.controllerRenderer = new ControllerRenderer(this.resources, map.size, this.mapRenderer.scale);

			this.gameState = new GameState(map, [1, 1]);
			map.layers.portals = new Widget.Layer();
			map.layers.portals.set([18, 28], new Widget(0, Widget.CHEST));
			
			this.firstHeart = true;
			
			controller.showOverlay(document.getElementById('start'));
		}
		
		this.onResume = function() {
			this.redraw();
			
			if (!this.interval) {
				this.interval = setInterval(this.onTick.bind(this), 50);
			}
		}
		
		this.pause = function() {
			if (this.interval) clearInterval(this.interval);
			
			this.interval = null;
		}
		
		this.onFinish = this.pause;
		
		this.onTick = function() {
			var goals = this.gameState.map.getSpecials(Tile.END).concat(this.gameState.map.layers.stars.allLocations());
			
			var generator = new Generator(this.gameState.map, goals, this.gameState.events);
			
			generator.mutations.push(config.randomFloorMutation);
			generator.mutations.push(config.randomFloorDestruction);
			generator.mutations.push(config.randomStarMutation);
			
			this.gameState.map = generator.evolve(10);
			
			this.searchRenderer.search = generator.search;
			
			this.redraw();
		}
		
		this.redraw = function() {
			var context = controller.canvas.getContext('2d'),
				layers = [this.gameState.map, this.gameState.map.layers.portals, this.gameState.map.layers.stars, this.gameState];
			
			this.mapRenderer.display(context, layers);
			
			this.controllerRenderer.display(context, controller);
			//this.searchRenderer.display(context);
		}
		
		this.onUserEvent = function(event) {
			if (this.gameState.isValidEvent(event)) {
				this.gameState.pushEvent(event);
				
				if (this.gameState.map.layers.stars[this.gameState.playerLocation]) {
					delete this.gameState.map.layers.stars[this.gameState.playerLocation];
					
					controller.updateScore(500);
					controller.updateLives(1);
					this.resources.get(Event.HEART).play();
					
					if (this.firstHeart) {
						this.pause();
						controller.showOverlay(document.getElementById('heart'));
						
						this.firstHeart = false;
					}
				}
				
				this.resources.get(Event.MOVE).play();
				
				if (Vec2.equals(this.gameState.playerLocation, [18, 28])) {
					this.resources.get(Event.EXIT).play();
					
					controller.updateScore(1000);
					controller.levelCompleted();
				}
			}
			
			this.redraw();
		}
		
		this.resources.loaded(controller.runLevel.bind(controller, this));
	},
	
	start: function(controller) {
		return new this.Level(this, controller);
	},
});