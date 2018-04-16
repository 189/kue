

/**
 * Observe 递归遍历 Kue.option.data 的属性
 * 依次Object.defineProperty 处理 get 和 set
 * @param {object} data 
 */
function Observe(data) {
	this.data = data;
	this.walk();
}

Observe.prototype = {
	walk : function(){
		const me = this;
		Object.keys(this.data).forEach(function(key){
			me.convert(key, me.data[key]);
		})
	},

	convert : function(key, value){
		this.defineReactive(key, value);
	},

	defineReactive : function(key, value){
		const dep = new Dep();
		observe(value);
		Object.defineProperty(this.data, key, {
			configurable : false,
			enumerable : true,
			get : function () {
				// Dep.target 即为 Watcher 实例
				if(Dep.target){
					// watcher 订阅 dep
					Dep.target.addDep(dep);
				}
				return value;
			},
			set : function (val) {
				if(val === value){
					return false;
				}
				value = val;
				observe(value);
				// 发布
				dep.notify();
			}
		})
	}
};


function observe(data){
	if(typeof data != 'object'){
		return;
	}
	return new Observe(data);
}


let uid = 0;

function Dep(){
	this.uid = uid++;
	this.subs = [];
}

Dep.prototype = {
	addSub : function(watcher){
		this.subs.push(watcher);
	},

	removeSub: function(watcher) {
		var index = this.subs.indexOf(watcher);
		if (index != -1) {
				this.subs.splice(index, 1);
		}
	},

	notify: function() {
		this.subs.forEach(function(watcher) {
			watcher.update();
		});
	}
};

Dep.target = null;
