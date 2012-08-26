
Tileshift.addLevel({
	name: 'chest',
	description: 'Find the key to open the chest!',
	difficulty: 1.0,
	
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
				map.set([r, c], new Tile(0, Platform.FLOOR));
			}
		}
	},

	randomStarMutation: function(generator, map) {
		var r = randomInt(11) - 5, c = randomInt(11) - 5;

		r += generator.currentPosition[0];
		c += generator.currentPosition[1];

		if (map.get([r, c]) != null)
			map.layers.stars[[r, c]] = new Widget(0, Widget.STAR);
	},
	
	Level: function(config, controller) {
		this.resources = new ResourceLoader(controller.resources);
		this.resources.loadAudio('Player.MOVE', 'effects/Step.wav');
		
		this.onBegin = function() {
			var map = new TileMap([20, 30]);
			map.set([1, 1], new Tile(0, Tile.START))
			map.set([18, 28], new Tile(0, Tile.FLOOR, Tile.END));

			map.layers.stars = new Widget.Layer();

			this.mapRenderer = new TileMapRenderer(this.resources, map.size);
			controller.resizeCanvas(this.mapRenderer.pixelSize());

			this.searchRenderer = new SearchRenderer(this.mapRenderer.scale);

			this.gameState = new GameState(map, [1, 1]);
			this.gameState.widgets[[18, 28]] = new Widget(0, Widget.CHEST);
			
			this.redraw();
			
			if (!this.interval) {
				this.interval = setInterval(this.onTick.bind(this), 50);
			}
		}
		
		this.onFinish = function() {
			if (this.interval) clearInterval(this.interval);
			
			this.interval = null;
		}
		
		this.onTick = function() {
			var generator = new Generator(this.gameState.map, this.gameState.events);
			generator.mutations.push(config.randomFloorMutation);
			generator.mutations.push(config.randomStarMutation);
			
			this.gameState.map = generator.evolve(10);
			
			this.searchRenderer.search = generator.search;
			
			this.redraw();
		}
		
		this.redraw = function() {
			var context = controller.canvas.getContext('2d');
			this.mapRenderer.display(context, [this.gameState.map, this.gameState, this.gameState.map.layers.stars]);
			this.searchRenderer.display(context);
		}
		
		this.onUserEvent = function(event) {
			if (this.gameState.isValidEvent(event)) {
				this.gameState.pushEvent(event);
				
				if (this.gameState.map.layers.stars[this.gameState.playerLocation]) {
					delete this.gameState.map.layers.stars[this.gameState.playerLocation];
					
					this.resources.get(Event.CHEST).play();
				}
				
				this.resources.get('Player.MOVE').play();
				
				if (Vec2.equals(this.gameState.playerLocation, [18, 28])) {
					this.resources.get(Event.CHEST).play();
					
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