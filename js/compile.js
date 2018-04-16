function Compile(element, vm) {
  this.$vm = vm;
  this.$el = this.isElementNode(element)
    ? element
    : document.querySelector(element);

  if (this.$el) {
    // 将 Kue 根节点内所有元素节点转为文档碎片以提高解析和编译性能
    this.$fragment = this.node2Fragment(this.$el);
    // 解析编译文档碎片
    this.compileElement(this.$fragment);
    // 文档碎片重新插入文档中
    this.$el.appendChild(this.$fragment);
  }
}

Compile.prototype = {
  node2Fragment: function() {
    let fragments = document.createDocumentFragment(),
      child;
    while ((child = this.$el.firstChild)) {
      fragments.appendChild(child);
    }
    return fragments;
  },

  compileElement: function(fregment) {
    let childNodes = fregment.childNodes,
      me = this;

    [].slice.call(childNodes).forEach(function(node) {
      let text = node.textContent,
        reg = /\{\{(.*)\}\}/;

      // 若为元素节点 遍历节点上所有属性，解析其中的 Kue 指令
      if (me.isElementNode(node)) {
        me.compile(node);
      } else if (me.isTextNode(node) && reg.test(text)) {
				console.log(node);
        me.compileText(node, RegExp.$1.trim());
      }

      if (node.childNodes && node.childNodes.length) {
        me.compileElement(node);
      }
    });
  },

  compile: function(node) {
    let nodeAttrs = node.attributes,
      me = this;

    [].slice.call(nodeAttrs).forEach(function(attr) {
      let attrName = attr.name;
      if (me.isDirective(attrName)) {
        let exp = attr.value,
          dir = attrName.substring(2);
        // 事件指令
        if (me.isEventDirective(dir)) {
          compileUtil.eventHandler(node, me.$vm, exp, dir);
          // 普通指令
        } else {
          if (compileUtil[dir]) {
            compileUtil[dir](node, me.$vm, exp);
          }
        }
        node.removeAttribute(attrName);
      }
    });
  },

  compileText: function(node, exp) {
    compileUtil.text(node, this.$vm, exp);
  },

  isDirective: function(attr) {
    return attr.indexOf("v-") == 0;
  },

  isEventDirective: function(dir) {
    return dir.indexOf("on") === 0;
  },

  isElementNode: function(node) {
    return node.nodeType == 1;
  },

  isTextNode: function(node) {
    return node.nodeType == 3;
  }
};

const compileUtil = {
  text: function(node, vm, exp) {
    this.bind(node, vm, exp, "text");
  },

  html: function(node, vm, exp) {
    this.bind(node, vm, exp, "html");
  },

  model: function(node, vm, exp) {
    this.bind(node, vm, exp, "model");

    let me = this,
      val = this._getVMVal(vm, exp);
    node.addEventListener("input", function(e) {
      var newValue = e.target.value;
      if (val === newValue) {
        return;
      }

      me._setVMVal(vm, exp, newValue);
      val = newValue;
    });
  },

  class: function(node, vm, exp) {
    this.bind(node, vm, exp, "class");
  },

  /**
   * bind 干两件事：
   * 1、根据指令更新原始DOM的属性值
   * 		若指令为 text，更新 textContent;
   * 		若指令为 model 更新 value;
   * 		若指令为 html 更新节点 innerHTML
   * 		...
   * 2、实例化一个 watcher watch 当前表达式的变化，一旦发生变化 执行上述第1点
   * 		watcher 在实例化的时候，会获取一次当前表达式的值，触发 observe 中的 get，将当前 wather实例作为订阅者放到 dep 实例的订阅者数组中
   */
  bind: function(node, vm, exp, dir) {
    var updaterFn = updater[dir + "Updater"];

    updaterFn && updaterFn(node, this._getVMVal(vm, exp));

    new Watcher(vm, exp, function(value, oldValue) {
      updaterFn && updaterFn(node, value, oldValue);
    });
  },

  // 事件处理
  eventHandler: function(node, vm, exp, dir) {
    var eventType = dir.split(":")[1],
      fn = vm.$options.methods && vm.$options.methods[exp];

    if (eventType && fn) {
      node.addEventListener(eventType, fn.bind(vm), false);
    }
  },

  _getVMVal: function(vm, exp) {
    var val = vm;
    exp = exp.split(".");
    exp.forEach(function(k) {
      val = val[k];
    });
    return val;
  },

  _setVMVal: function(vm, exp, value) {
    var val = vm;
    exp = exp.split(".");
    exp.forEach(function(k, i) {
      // 非最后一个key，更新val的值
      if (i < exp.length - 1) {
        val = val[k];
      } else {
        val[k] = value;
      }
    });
  }
};

var updater = {
  textUpdater: function(node, value) {
    node.textContent = typeof value == "undefined" ? "" : value;
  },

  htmlUpdater: function(node, value) {
    node.innerHTML = typeof value == "undefined" ? "" : value;
  },

  classUpdater: function(node, value, oldValue) {
    var className = node.className;
    className = className.replace(oldValue, "").replace(/\s$/, "");

    var space = className && String(value) ? " " : "";

    node.className = className + space + value;
  },

  modelUpdater: function(node, value, oldValue) {
    node.value = typeof value == "undefined" ? "" : value;
  }
};
