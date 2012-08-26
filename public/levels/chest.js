
Tileshift.addLevel({
	name: 'chest',
	description: 'Find the key to open the chest!',
	difficulty: 1.0,
	
	Level: function(config, controller) {
		this.resources = new ResourceLoader(controller.resources);
		this.resources.loadAudio('Player.MOVE', 'effects/Step.wav');
		
		this.onBegin = function() {
			this.map = new TileMap([20, 30]);
			this.map.set([1, 1], new Tile(0, Tile.START))
			this.map.set([18, 28], new Tile(0, Tile.FLOOR, Tile.END));

			this.mapRenderer = new TileMapRenderer(this.resources, this.map.size);
			controller.resizeCanvas(this.mapRenderer.pixelSize());

			this.searchRenderer = new SearchRenderer(this.mapRenderer.scale);

			this.gameState = new GameState(this.map, [1, 1]);
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
			var generator = new Generator(this.map, this.gameState.events);
			this.map = generator.evolve(10);
			
			this.searchRenderer.search = generator.search; 
			this.gameState.map = this.map;
			
			this.redraw();
		}
		
		this.redraw = function() {
			var context = controller.canvas.getContext('2d');
			this.mapRenderer.display(context, [this.map, this.gameState]);
			this.searchRenderer.display(context);
		}
		
		this.onUserEvent = function(event) {
			if (this.gameState.isValidEvent(event)) {
				this.gameState.pushEvent(event);
				
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