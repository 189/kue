const keys = Object.keys, defineProperty = Object.defineProperty;

function Kue(options){
	const me = this;
	this.$options = options || {};
  this.$data = this.$options.data;
    
  keys(this.$data).forEach(function(key){
		me._proxy(key);
	});

	this.initComputed();
	observe(this.$data, this);
	this.compiler = new Compile('#box', this);
}   

Kue.prototype = {
	$watch : function(key, fn){
		const me = this;
		return new Watcher(this, key, function(){
			fn(me);
		})
	},

	initComputed : function(){
		const me = this, computed = this.$options.computed;
		if(typeof computed === 'object'){
			Object.keys(computed).forEach(function(key){
				Object.defineProperty(me, key, {
					get : typeof computed[key] === 'function' ? computed[key] : computed[key].get,
					set : function(){}
				})
			})
		}
	},

	_proxy : function(key){
		const me = this;
		defineProperty(this, key, {
			configurable : false,
			enumerable : true,
			get : function proxyGetter(){
				return me.$data[key];
			},
			set : function proxySetter(value){
				me.$data[key] = value;
			}
		})
	}
};
