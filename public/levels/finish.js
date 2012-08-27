
Tileshift.addLevel({
	name: 'finish',
	difficulty: 100.0,
	
	Level: function(config, controller) {
		this.onStart = function() {
			var map = new TileMap([20, 30]);
			
			this.mapRenderer = new TileMapRenderer(this.resources, map.size);
			controller.resizeCanvas(this.mapRenderer.pixelSize());
			
			controller.showOverlay(document.getElementById('finish'));
		}
		
		this.onResume = function() {
			controller.levelCompleted();
		}
		
		this.onFinish = function() {
			
		}
		
		this.onUserEvent = function(event) {
		}
		
		this.redraw = function() {
			var context = controller.canvas.getContext('2d');
			
			this.mapRenderer.display(context, []);
		}
		
		controller.runLevel(this);
	},
	
	start: function(controller) {
		return new this.Level(this, controller);
	},
});