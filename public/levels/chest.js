
Tileshift.addLevel({
	name: 'chest',
	description: 'Find the key to open the chest!',
	difficulty: 1.0,
	start: function(controller) {
		this.resources = new ResourceLoader();
		this.resources.loadImage(Platform.FLOOR, 'tiles/Stone Block.png');
		this.resources.loadImage(Platform.WALL, 'tiles/Stone Block Tall.png');
		this.resources.loadImage(Platform.START, 'tiles/Wall Block.png');
		this.resources.loadImage(Widget.PLAYER, 'tiles/Character Cat Girl.png');
		this.resources.loadImage(Widget.CHEST, 'tiles/Chest Closed.png');
		this.resources.loadImage(Widget.KEY, 'tiles/Key.png');
		
		this.onBegin = function() {
			this.map = new TileMap([20, 30]);
			this.map.set([1, 1], new Tile(0, Tile.START))
			this.map.set([18, 28], new Tile(0, Tile.FLOOR, Tile.END));

			this.mapRenderer = new TileMapRenderer(this.resources, this.map.size);
			controller.resizeCanvas(this.mapRenderer.pixelSize());

			this.gameState = new GameState(this.map, [1, 1]);
			this.gameState.widgets[[18, 28]] = new Widget(0, Widget.CHEST);
			
			this.redraw();
			
			if (!this.interval) {
				this.interval = setInterval(this.onTick.bind(this), 50);
			}
		}
		
		this.onFinish = function() {
			if (this.interval) clearInterval(this.interval);
		}
		
		this.onTick = function() {
			var generator = new Generator(this.map, this.gameState.events);
			this.map = generator.evolve(10);
			
			this.gameState.map = this.map;
			
			this.redraw();
		}
		
		this.redraw = function() {
			var context = controller.canvas.getContext('2d');
			this.mapRenderer.display(context, [this.map, this.gameState]);
		}
		
		this.onUserEvent = function(event) {
			if (this.gameState.isValidEvent(event)) {
				this.gameState.pushEvent(event);
				
				if (Vec2.equals(this.gameState.playerLocation, [18, 28])) {
					controller.levelCompleted();
				}
			}
			
			this.redraw();
		}
		
		this.resources.loaded(controller.runLevel.bind(controller, this));
	}
});