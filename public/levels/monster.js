
function Monster(identity) {
	Widget.call(this, 5.0, identity);
}

Monster.prototype = new Widget();
Monster.prototype.constructor = Monster;

Monster.BUG = 'Monster.BUG';

Tileshift.addLevel({
	name: 'monster',
	description: 'Find the key to open the chest!',
	difficulty: 5.0,
	
	Level: function(config, controller) {
		this.resources = new ResourceLoader(controller.resources);
		this.resources.loadAudio(Event.MOVE, 'effects/Step.wav');
		this.resources.loadImage(Monster.BUG, 'tiles/Enemy Bug.png');
		
		this.onBegin = function() {
			var map = new TileMap([20, 30]);
			
			for (var r = 0; r < map.size[0]; r += 1) {
				for (var c = 0; c < map.size[1]; c += 1) {
					map.set([r, c], new Tile(0, Tile.FLOOR));
				}
			}

			//for (var i = 10; i < 16; i += 1)
			//	map.set([i, 20], null);
			
			//for (var i = 15; i < 20; i += 1)
			//	map.set([15, i], null);

			map.set([10, 15], new Tile(0, Tile.START));
			map.set([18, 28], new Tile(0, Tile.END, Tile.END));

			//map.set([8, 5], new Tile(0, Tile.END, Tile.END));
			//map.set([18, 5], new Tile(0, Tile.END, Tile.END));

			map.layers.monsters = new Widget.Layer();
			map.layers.monsters.set([2, 2], new Monster(Monster.BUG));

			this.mapRenderer = new TileMapRenderer(this.resources, map.size);
			controller.resizeCanvas(this.mapRenderer.pixelSize());

			this.controllerRenderer = new ControllerRenderer(this.resources, map.size, this.mapRenderer.scale);
			this.searchRenderer = new SearchRenderer(this.mapRenderer.scale);

			this.gameState = new GameState(map, [10, 15]);
			map.layers.portals = new Widget.Layer();
			map.layers.portals.set([18, 28], new Widget(0, Widget.CHEST));

			this.redraw();
			
			if (!this.interval) {
				this.interval = setInterval(this.onTick.bind(this), 100);
			}
		}
		
		this.onFinish = function() {
			if (this.interval) clearInterval(this.interval);
			
			this.interval = null;
		}
		
		this.onTick = function() {
			var dead = false;
			
			var monsters = this.gameState.map.layers.monsters,
				playerLocation = this.gameState.playerLocation;
			
			for (var key in monsters) {
				var location = convertLocationKey(key);
				
				var delegate = new TileMapSearch(this.gameState.map, [playerLocation]),
					search = new PathFinder(delegate);

				delegate.distanceFunction = Vec2.euclidianDistance;

				delegate.prime(search, location);
				search.update(2);
				
				var next = search.best.step;
				this.gameState.map.layers.monsters.move(location, next);
				
				if (Vec2.equals(this.gameState.playerLocation, next)) {
					this.resources.get(Event.DAMAGE).play();
					dead = true;
				}
			}
			
			this.redraw();
			
			if (dead)
				controller.levelFailed();
		}
		
		this.redraw = function() {
			var context = controller.canvas.getContext('2d'),
				layers = [this.gameState.map, this.gameState.map.layers.portals, this.gameState.map.layers.monsters, this.gameState];
			
			this.mapRenderer.display(context, layers);
			
			this.controllerRenderer.display(context, controller);
		}
		
		this.onUserEvent = function(event) {
			if (this.gameState.isValidEvent(event)) {
				this.gameState.pushEvent(event);
			}
			
			this.redraw();
		}
		
		this.resources.loaded(controller.runLevel.bind(controller, this));
	},
	
	start: function(controller) {
		return new this.Level(this, controller);
	},
});