
function Watcher(vm, exp, fn){
  this.vm = vm;
  this.exp = exp;
  this.depIds = {};
  this.fn = fn;
  
  if(typeof exp === 'function'){
    this.getter = exp;
  }
  else {
    this.getter = this.parseGetter(exp);
  }
  this.value = this.get();
}

Watcher.prototype = {
  update : function(){
    let value = this.get();
    let oldVal = this.value;
    if (value !== oldVal) {
        this.value = value;
        this.fn.call(this.vm, value, oldVal);
    }
  },

  get : function(){
    Dep.target = this;
    // 此次会触发 observe 中 对应 data 的 getter ，将当前 watcher 实例存入 dep 的订阅者数组中
    let value = this.getter(this.vm);
    Dep.target = null;
    return value;
  },

  parseGetter : function(){
    if(/\w./.test(this.exp)){
      let exps = this.exp.split('.');
      return function(v){
        for (let i = 0, len = exps.length; i < len; i++) {
            if (!v) {
              return;
            };
            v = v[exps[i]];
        }
        return v;
      }
    }
  },

  addDep : function(dep){
    // 当前 watcher 实例是否已经被收集到某个 dep 里了
    if(!this.depIds.hasOwnProperty(dep.uid)){
      // 订阅发布模式 dep 实例 收集当前 watcher实例作为订阅者
      dep.addSub(this);
      // 标记当前 wather 实例已经被收集到某个 dep 实例中了，避免重复收集
      this.depIds[dep.uid] = dep;
    }
  }
};