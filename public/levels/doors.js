
function DoorWidget() {
	Widget.call(this, -1, Widget.DOOR);
	this.offset = -10;
	
	this.key = null;
}

DoorWidget.prototype = new Widget();
DoorWidget.prototype.constructor = DoorWidget;

function KeyWidget() {
	Widget.call(this, 0, Widget.KEY);
	this.offset = -10;
	
	this.door = null;
}

KeyWidget.prototype = new Widget();
KeyWidget.prototype.constructor = KeyWidget;

Tile.BRIDGE = 'Tile.BRIDGE';

Tileshift.addLevel({
	name: 'doors',
	description: 'Find you way through the doors, to open the chest!',
	difficulty: 1.2,
	
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
	
	Level: function(config, controller) {
		this.resources = new ResourceLoader(controller.resources);
		this.resources.loadImage(Tile.WATER, 'tiles/Water Block.png');
		this.resources.loadImage(Tile.DIRT, 'tiles/Dirt Block.png');
		this.resources.loadImage(Widget.DOOR, 'tiles/Door Tall Closed.png');
		this.resources.loadImage(Tile.BRIDGE, 'tiles/Bridge.png');
		this.resources.loadAudio(Event.DOOR, 'effects/Door.wav');
		this.resources.loadAudio(Event.KEY, 'effects/Key.wav');
		
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
			generator.mutations.push(config.randomFloorMutation);
			
			this.map = generator.evolve(10);
			
			this.gameState.map = this.map;
			
			this.redraw();
		}
		
		this.redraw = function() {
			var context = controller.canvas.getContext('2d');
			this.mapRenderer.display(context, [this.map, this.gameState, this.map.layers.doors, this.map.layers.keys]);
		}
		
		this.onUserEvent = function(event) {
			var location = Vec2.add(this.gameState.playerLocation, Event.displacement(event)),
				doors = this.map.layers.doors,
				door = doors[location];
			
			if (door) {
				console.log('door', door, this.gameState.playerKeys);
				
				if (this.gameState.playerKeys[door.key.number]) {
					delete this.gameState.playerKeys[door.key];
					delete doors[location];
					
					this.resources.get(Event.DOOR).play();
					
					this.gameState.pushEvent(event);
				}
			} else if (this.gameState.isValidEvent(event)) {
				this.gameState.pushEvent(event);
				
				if (Vec2.equals(this.gameState.playerLocation, [18, 28])) {
					this.resources.get(Event.CHEST).play();
					
					controller.levelCompleted();
				}
				
				var keys = this.map.layers.keys,
					key = keys[this.gameState.playerLocation];
				if (key) {
					this.gameState.playerKeys[key.number] = true;
					
					this.resources.get(Event.KEY).play();
					
					delete keys[this.gameState.playerLocation]; //Clone before delete to store in player.
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