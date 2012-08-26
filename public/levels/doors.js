function DoorWidget() {
	Widget.call(this, -1, Widget.DOOR);
	this.offset = -50;
}

DoorWidget.prototype = new Widget();
DoorWidget.prototype.constructor = DoorWidget;

function KeyWidget(doorCoordinates) {
	Widget.call(this, 0, Widget.KEY);
	this.offset = -10;
	this.door = doorCoordinates;
}

KeyWidget.prototype = new Widget();
KeyWidget.prototype.constructor = KeyWidget;

Tileshift.addLevel({
	name: 'doors',
	description: 'Find you way through the doors, to open the chest!',
	difficulty: 1.0,
	start: function(controller) {
		this.resources = new ResourceLoader();
		this.resources.loadImage(Tile.FLOOR, 'tiles/Stone Block.png');
		this.resources.loadImage(Tile.WALL, 'tiles/Stone Block Tall.png');
		this.resources.loadImage(Tile.START, 'tiles/Wall Block.png');
		this.resources.loadImage(Widget.PLAYER, 'tiles/Character Cat Girl.png');
		this.resources.loadImage(Widget.CHEST, 'tiles/Chest Closed.png');
		this.resources.loadImage(Widget.KEY, 'tiles/Key.png');
		this.resources.loadImage(Platform.WATER, 'tiles/Water Block.png');
		this.resources.loadImage(Platform.DIRT, 'tiles/Dirt Block.png');
		this.resources.loadImage(Widget.DOOR, 'tiles/Door Tall Closed.png');
		this.resources.loadImage(Widget.KEY, 'tiles/Key.png');
		
		this.onBegin = function() {
			this.map = new TileMap([20, 30]);
			this.map.set([1, 1], new Tile(0, Tile.START))
			this.map.set([18, 28], new Tile(0, Tile.FLOOR, Tile.END));
			this.map.layers.doors = new Widget.Layer();
			this.map.layers.keys = new Widget.Layer();

			this.mapRenderer = new TileMapRenderer(this.resources, this.map.size);
			controller.resizeCanvas(this.mapRenderer.pixelSize());

			this.gameState = new GameState(this.map, [1, 1]);
			this.gameState.widgets[[18, 28]] = new Widget(0, Widget.CHEST);
			this.gameState.playerKeys = {};
			
			this.map.rooms = [];
			this.map.doors = [];
			generateRoomsOnMap(this.map, this.map.rooms, 6);
			generateMapDoorsKeys(this.map, 4);
			
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
			this.mapRenderer.display(context, [this.map, this.gameState, this.map.layers.doors, this.map.layers.keys]);
		}
		
		this.onUserEvent = function(event) {
			//TODO HERE: if (event
		
			if (this.gameState.isValidEvent(event)) {
				this.gameState.pushEvent(event);
				
				if (Vec2.equals(this.gameState.playerLocation, [18, 28])) {
					controller.levelCompleted();
				}
				
				var keys = this.map.layers.keys,
					key = keys[this.gameState.playerLocation];
				if (key) {
					this.gameState.playerKeys[key] = true;
					delete keys[this.gameState.playerLocation]; //Clone before delete to store in player.
				}
			}
			
			this.redraw();
		}
		
		this.resources.loaded(controller.runLevel.bind(controller, this));
	}
});