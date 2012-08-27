
function DoorWidget() {
	Widget.call(this, -1, Widget.DOOR);
	this.offset = -20;
	
	this.key = null;
}

DoorWidget.prototype = new Widget();
DoorWidget.prototype.constructor = DoorWidget;

function KeyWidget() {
	Widget.call(this, 0, Widget.KEY);
	this.offset = -20;
	
	this.door = null;
}

KeyWidget.prototype = new Widget();
KeyWidget.prototype.constructor = KeyWidget;

Tile.BRIDGE = 'Tile.BRIDGE';

Tileshift.addLevel({
	name: 'doorsLevel1',
	description: 'Find you way through the doors, to open the chest!',
	difficulty: 2.1,
	
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
	
	Level: function(config, controller) {
		this.resources = new ResourceLoader(controller.resources);
		this.resources.loadImage(Widget.DOOR, 'tiles/Door Tall Closed.png');
		this.resources.loadImage(Tile.BRIDGE, 'tiles/Bridge.png');
		this.resources.loadAudio(Event.DOOR, 'effects/Door.wav');
		this.resources.loadAudio(Event.KEY, 'effects/Key.wav');
		
		this.onStart = function() {
			var map = new TileMap([20, 30]);
			map.set([1, 1], new Tile(0, Tile.START))
			map.set([18, 28], new Tile(0, Tile.FLOOR, Tile.END));
			map.layers.doors = new Widget.Layer();
			map.layers.keys = new Widget.Layer();

			this.mapRenderer = new TileMapRenderer(this.resources, map.size);
			controller.resizeCanvas(this.mapRenderer.pixelSize());

			this.controllerRenderer = new ControllerRenderer(this.resources, map.size, this.mapRenderer.scale);

			this.gameState = new GameState(map, [1, 1]);
			map.layers.portals = new Widget.Layer();
			map.layers.portals.set([18, 28], new Widget(0, Widget.CHEST));

			this.gameState.playerKeys = {};
			this.controllerRenderer = new ControllerRenderer(this.resources, map.size, this.mapRenderer.scale);
			map.rooms = [];
			map.doors = [];
			generateRoomsOnMap(map, map.rooms, 4);
			generateMapDoorsKeys(this.gameState, map, 1);
			
			controller.showOverlay(document.getElementById('doors'));
		}
		
		this.onResume = function() {
			this.redraw();
			
			if (!this.interval) {
				this.interval = setInterval(this.onTick.bind(this), 50);
			}
		}
		
		this.onFinish = function() {
			if (this.interval) clearInterval(this.interval);
		}
		
		this.onTick = function() {
			var goals = this.gameState.map.getSpecials(Tile.END).concat(
					this.gameState.map.layers.keys.allLocations(), 
					this.gameState.map.layers.doors.allLocations()),
				generator = new Generator(this.gameState.map, goals, this.gameState.events);
			generator.mutations.push(config.randomFloorMutation);
			
			this.gameState.map = generator.evolve(10);
			
			this.redraw();
		}
		
		this.redraw = function() {
			var context = controller.canvas.getContext('2d'),
				layers = [this.gameState.map, this.gameState.map.layers.portals, this.gameState.map.layers.doors, this.gameState.map.layers.keys, this.gameState];
			
			this.mapRenderer.display(context, layers);
			
			this.controllerRenderer.display(context, controller, this.gameState.playerKeys);
		}
		
		this.onUserEvent = function(event) {
			var location = Vec2.add(this.gameState.playerLocation, Event.displacement(event)),
				doors = this.gameState.map.layers.doors,
				door = doors[location];
			
			if (door) {
				if (this.gameState.playerKeys[door.key.number]) {
					delete this.gameState.playerKeys[door.key];
					delete doors[location];
					
					this.resources.get(Event.DOOR).play();
					
					this.gameState.pushEvent(event);
				}
			} else if (this.gameState.isValidEvent(event)) {
				this.gameState.pushEvent(event);
				this.resources.get(Event.MOVE).play();
				
				if (Vec2.equals(this.gameState.playerLocation, [18, 28])) {
					this.resources.get(Event.EXIT).play();
					
					controller.levelCompleted();
				}
				
				var keys = this.gameState.map.layers.keys,
					key = keys[this.gameState.playerLocation];
				if (key) {
					this.gameState.playerKeys[key.number] = key;
					
					this.resources.get(Event.KEY).play();
					
					delete keys[this.gameState.playerLocation]; 
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