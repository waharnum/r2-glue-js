var ReadiumGlue = (function (exports) {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [0, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    var PROTOCOL_NAME = 'r2-glue-js';
    var PROTOCOL_VERSION = '1.0.0';
    var MessageType;
    (function (MessageType) {
        MessageType["Invoke"] = "invoke";
        MessageType["Return"] = "return";
        MessageType["Callback"] = "callback";
    })(MessageType || (MessageType = {}));
    var messageCount = 0;
    var Message = /** @class */ (function () {
        function Message(namespace, type, key, value, correlationId) {
            this.namespace = namespace;
            this.type = type;
            this.key = key;
            this.value = value;
            this.correlationId = correlationId || "" + messageCount; // uuid();
            messageCount += 1;
            this.protocol = PROTOCOL_NAME;
            this.version = PROTOCOL_VERSION;
        }
        Message.validate = function (message) {
            return !!message.protocol && message.protocol === PROTOCOL_NAME;
        };
        return Message;
    }());

    var Receiver = /** @class */ (function () {
        function Receiver(namespace) {
            var _this = this;
            this.destroy = this.destroy.bind(this);
            this.handler = function (event) {
                var request = event.data;
                if (!Message.validate(request) || request.namespace !== namespace) {
                    return;
                }
                _this.processMessage(request, function (type, name, parameters) {
                    if (!event.source) {
                        return;
                    }
                    var sourceWindow = event.source;
                    sourceWindow.postMessage(new Message(namespace, type, name, parameters, request.correlationId), event.origin);
                });
            };
            window.addEventListener('message', this.handler);
        }
        Receiver.prototype.destroy = function () {
            window.removeEventListener('message', this.handler);
        };
        return Receiver;
    }());

    var Dispatcher = /** @class */ (function (_super) {
        __extends(Dispatcher, _super);
        function Dispatcher(namespace, handlerType) {
            var _this = _super.call(this, namespace) || this;
            _this._handler = new handlerType();
            return _this;
        }
        Dispatcher.prototype.processMessage = function (message, sendMessage) {
            this._handleRequest(message, sendMessage);
        };
        Dispatcher.prototype._handleRequest = function (message, sendResponse) {
            this._handler.declarations[message.key]
                .apply(this._handler, [
                function () {
                    var callbackArgs = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        callbackArgs[_i] = arguments[_i];
                    }
                    sendResponse(MessageType.Callback, message.key, callbackArgs);
                }
            ].concat(message.value))
                .then(function (returnValue) { return sendResponse(MessageType.Return, message.key, returnValue); });
        };
        return Dispatcher;
    }(Receiver));

    var MessageHandler = /** @class */ (function () {
        function MessageHandler() {
        }
        return MessageHandler;
    }());

    var AbstractEventManager = /** @class */ (function () {
        function AbstractEventManager() {
            this.lastEventID = 0;
            this.registeredEventHandlers = {};
        }
        AbstractEventManager.prototype.getEventHandler = function (eventID) {
            return this.registeredEventHandlers[eventID];
        };
        AbstractEventManager.prototype.generateEventID = function () {
            return this.lastEventID += 1;
        };
        AbstractEventManager.prototype.addEventListener = function (eventType, callback, options) {
            var id = this.generateEventID();
            this.registeredEventHandlers[id] = {
                eventType: eventType,
                callback: callback,
                options: options,
            };
            return id;
        };
        AbstractEventManager.prototype.removeEventListener = function (id) {
            delete this.registeredEventHandlers[id];
        };
        return AbstractEventManager;
    }());

    var EventManager = /** @class */ (function (_super) {
        __extends(EventManager, _super);
        function EventManager() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.registeredEventRemovers = {};
            return _this;
        }
        EventManager.prototype.addEventListener = function (type, callback, options, resolvedTargets) {
            var resolved = resolvedTargets;
            if (!(resolved && resolved.length))
                resolved = [window];
            var listenerRemovers = resolved.map(function (resolvedTarget) {
                resolvedTarget.addEventListener(type, callback, options);
                return function () {
                    resolvedTarget.removeEventListener(type, callback, options);
                };
            });
            var id = _super.prototype.addEventListener.call(this, type, callback, options);
            this.registeredEventRemovers[id] = listenerRemovers;
            return id;
        };
        EventManager.prototype.removeEventListener = function (id) {
            _super.prototype.removeEventListener.call(this, id);
            var eventRemovers = this.registeredEventRemovers[id] || [];
            eventRemovers.forEach(function (remove) {
                remove();
            });
            delete this.registeredEventRemovers[id];
        };
        return EventManager;
    }(AbstractEventManager));

    var EventHandlingMessage;
    (function (EventHandlingMessage) {
        EventHandlingMessage["AddEventListener"] = "ADD_EVENT_LISTENER";
        EventHandlingMessage["RemoveEventListener"] = "REMOVE_EVENT_LISTENER";
    })(EventHandlingMessage || (EventHandlingMessage = {}));

    var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    /*! https://mths.be/cssesc v1.0.1 by @mathias */

    var object = {};
    var hasOwnProperty = object.hasOwnProperty;
    var merge = function merge(options, defaults) {
    	if (!options) {
    		return defaults;
    	}
    	var result = {};
    	for (var key in defaults) {
    		// `if (defaults.hasOwnProperty(key) { … }` is not needed here, since
    		// only recognized option names are used.
    		result[key] = hasOwnProperty.call(options, key) ? options[key] : defaults[key];
    	}
    	return result;
    };

    var regexAnySingleEscape = /[ -,\.\/;-@\[-\^`\{-~]/;
    var regexSingleEscape = /[ -,\.\/;-@\[\]\^`\{-~]/;
    var regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;

    // https://mathiasbynens.be/notes/css-escapes#css
    var cssesc = function cssesc(string, options) {
    	options = merge(options, cssesc.options);
    	if (options.quotes != 'single' && options.quotes != 'double') {
    		options.quotes = 'single';
    	}
    	var quote = options.quotes == 'double' ? '"' : '\'';
    	var isIdentifier = options.isIdentifier;

    	var firstChar = string.charAt(0);
    	var output = '';
    	var counter = 0;
    	var length = string.length;
    	while (counter < length) {
    		var character = string.charAt(counter++);
    		var codePoint = character.charCodeAt();
    		var value = void 0;
    		// If it’s not a printable ASCII character…
    		if (codePoint < 0x20 || codePoint > 0x7E) {
    			if (codePoint >= 0xD800 && codePoint <= 0xDBFF && counter < length) {
    				// It’s a high surrogate, and there is a next character.
    				var extra = string.charCodeAt(counter++);
    				if ((extra & 0xFC00) == 0xDC00) {
    					// next character is low surrogate
    					codePoint = ((codePoint & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000;
    				} else {
    					// It’s an unmatched surrogate; only append this code unit, in case
    					// the next code unit is the high surrogate of a surrogate pair.
    					counter--;
    				}
    			}
    			value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
    		} else {
    			if (options.escapeEverything) {
    				if (regexAnySingleEscape.test(character)) {
    					value = '\\' + character;
    				} else {
    					value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
    				}
    				// Note: `:` could be escaped as `\:`, but that fails in IE < 8.
    			} else if (/[\t\n\f\r\x0B:]/.test(character)) {
    				if (!isIdentifier && character == ':') {
    					value = character;
    				} else {
    					value = '\\' + codePoint.toString(16).toUpperCase() + ' ';
    				}
    			} else if (character == '\\' || !isIdentifier && (character == '"' && quote == character || character == '\'' && quote == character) || isIdentifier && regexSingleEscape.test(character)) {
    				value = '\\' + character;
    			} else {
    				value = character;
    			}
    		}
    		output += value;
    	}

    	if (isIdentifier) {
    		if (/^_/.test(output)) {
    			// Prevent IE6 from ignoring the rule altogether (in case this is for an
    			// identifier used as a selector)
    			output = '\\_' + output.slice(1);
    		} else if (/^-[-\d]/.test(output)) {
    			output = '\\-' + output.slice(1);
    		} else if (/\d/.test(firstChar)) {
    			output = '\\3' + firstChar + ' ' + output.slice(1);
    		}
    	}

    	// Remove spaces after `\HEX` escapes that are not followed by a hex digit,
    	// since they’re redundant. Note that this is only possible if the escape
    	// sequence isn’t preceded by an odd number of backslashes.
    	output = output.replace(regexExcessiveSpaces, function ($0, $1, $2) {
    		if ($1 && $1.length % 2) {
    			// It’s not safe to remove the space, so don’t.
    			return $0;
    		}
    		// Strip the space.
    		return ($1 || '') + $2;
    	});

    	if (!isIdentifier && options.wrap) {
    		return quote + output + quote;
    	}
    	return output;
    };

    // Expose default options (so they can be overridden globally).
    cssesc.options = {
    	'escapeEverything': false,
    	'isIdentifier': false,
    	'quotes': 'single',
    	'wrap': false
    };

    cssesc.version = '1.0.1';

    var cssesc_1 = cssesc;

    var dist = createCommonjsModule(function (module, exports) {
    var __assign = (commonjsGlobal && commonjsGlobal.__assign) || function () {
        __assign = Object.assign || function(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                    t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
    var __values = (commonjsGlobal && commonjsGlobal.__values) || function (o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    };
    Object.defineProperty(exports, "__esModule", { value: true });

    var Limit;
    (function (Limit) {
        Limit[Limit["All"] = 0] = "All";
        Limit[Limit["Two"] = 1] = "Two";
        Limit[Limit["One"] = 2] = "One";
    })(Limit || (Limit = {}));
    var config;
    var rootDocument;
    function default_1(input, options) {
        if (input.nodeType !== Node.ELEMENT_NODE) {
            throw new Error("Can't generate CSS selector for non-element node type.");
        }
        if ('html' === input.tagName.toLowerCase()) {
            return input.tagName.toLowerCase();
        }
        var defaults = {
            root: document.body,
            idName: function (name) { return true; },
            className: function (name) { return true; },
            tagName: function (name) { return true; },
            seedMinLength: 1,
            optimizedMinLength: 2,
            threshold: 1000,
        };
        config = __assign({}, defaults, options);
        rootDocument = findRootDocument(config.root, defaults);
        var path = bottomUpSearch(input, Limit.All, function () {
            return bottomUpSearch(input, Limit.Two, function () {
                return bottomUpSearch(input, Limit.One);
            });
        });
        if (path) {
            var optimized = sort(optimize(path, input));
            if (optimized.length > 0) {
                path = optimized[0];
            }
            return selector(path);
        }
        else {
            throw new Error("Selector was not found.");
        }
    }
    exports.default = default_1;
    function findRootDocument(rootNode, defaults) {
        if (rootNode.nodeType === Node.DOCUMENT_NODE) {
            return rootNode;
        }
        if (rootNode === defaults.root) {
            return rootNode.ownerDocument;
        }
        return rootNode;
    }
    function bottomUpSearch(input, limit, fallback) {
        var path = null;
        var stack = [];
        var current = input;
        var i = 0;
        var _loop_1 = function () {
            var level = maybe(id(current)) || maybe.apply(void 0, classNames(current)) || maybe(tagName(current)) || [any()];
            var nth = index(current);
            if (limit === Limit.All) {
                if (nth) {
                    level = level.concat(level.filter(dispensableNth).map(function (node) { return nthChild(node, nth); }));
                }
            }
            else if (limit === Limit.Two) {
                level = level.slice(0, 1);
                if (nth) {
                    level = level.concat(level.filter(dispensableNth).map(function (node) { return nthChild(node, nth); }));
                }
            }
            else if (limit === Limit.One) {
                var node = (level = level.slice(0, 1))[0];
                if (nth && dispensableNth(node)) {
                    level = [nthChild(node, nth)];
                }
            }
            for (var _i = 0, level_1 = level; _i < level_1.length; _i++) {
                var node = level_1[_i];
                node.level = i;
            }
            stack.push(level);
            if (stack.length >= config.seedMinLength) {
                path = findUniquePath(stack, fallback);
                if (path) {
                    return "break";
                }
            }
            current = current.parentElement;
            i++;
        };
        while (current && current !== config.root.parentElement) {
            var state_1 = _loop_1();
            if (state_1 === "break")
                break;
        }
        if (!path) {
            path = findUniquePath(stack, fallback);
        }
        return path;
    }
    function findUniquePath(stack, fallback) {
        var paths = sort(combinations(stack));
        if (paths.length > config.threshold) {
            return fallback ? fallback() : null;
        }
        for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
            var candidate = paths_1[_i];
            if (unique(candidate)) {
                return candidate;
            }
        }
        return null;
    }
    function selector(path) {
        var node = path[0];
        var query = node.name;
        for (var i = 1; i < path.length; i++) {
            var level = path[i].level || 0;
            if (node.level === level - 1) {
                query = path[i].name + " > " + query;
            }
            else {
                query = path[i].name + " " + query;
            }
            node = path[i];
        }
        return query;
    }
    function penalty(path) {
        return path.map(function (node) { return node.penalty; }).reduce(function (acc, i) { return acc + i; }, 0);
    }
    function unique(path) {
        switch (rootDocument.querySelectorAll(selector(path)).length) {
            case 0:
                throw new Error("Can't select any node with this selector: " + selector(path));
            case 1:
                return true;
            default:
                return false;
        }
    }
    function id(input) {
        var elementId = input.getAttribute('id');
        if (elementId && config.idName(elementId)) {
            return {
                name: '#' + cssesc_1(elementId, { isIdentifier: true }),
                penalty: 0,
            };
        }
        return null;
    }
    function classNames(input) {
        var names = Array.from(input.classList)
            .filter(config.className);
        return names.map(function (name) { return ({
            name: '.' + cssesc_1(name, { isIdentifier: true }),
            penalty: 1
        }); });
    }
    function tagName(input) {
        var name = input.tagName.toLowerCase();
        if (config.tagName(name)) {
            return {
                name: name,
                penalty: 2
            };
        }
        return null;
    }
    function any() {
        return {
            name: '*',
            penalty: 3
        };
    }
    function index(input) {
        var parent = input.parentNode;
        if (!parent) {
            return null;
        }
        var child = parent.firstChild;
        if (!child) {
            return null;
        }
        var i = 0;
        while (child) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                i++;
            }
            if (child === input) {
                break;
            }
            child = child.nextSibling;
        }
        return i;
    }
    function nthChild(node, i) {
        return {
            name: node.name + (":nth-child(" + i + ")"),
            penalty: node.penalty + 1
        };
    }
    function dispensableNth(node) {
        return node.name !== 'html' && !node.name.startsWith('#');
    }
    function maybe() {
        var level = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            level[_i] = arguments[_i];
        }
        var list = level.filter(notEmpty);
        if (list.length > 0) {
            return list;
        }
        return null;
    }
    function notEmpty(value) {
        return value !== null && value !== undefined;
    }
    function combinations(stack, path) {
        var _i, _a, node;
        if (path === void 0) { path = []; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(stack.length > 0)) return [3 /*break*/, 5];
                    _i = 0, _a = stack[0];
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    node = _a[_i];
                    return [5 /*yield**/, __values(combinations(stack.slice(1, stack.length), path.concat(node)))];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, path];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    }
    function sort(paths) {
        return Array.from(paths).sort(function (a, b) { return penalty(a) - penalty(b); });
    }
    function optimize(path, input) {
        var i, newPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(path.length > 2 && path.length > config.optimizedMinLength)) return [3 /*break*/, 5];
                    i = 1;
                    _a.label = 1;
                case 1:
                    if (!(i < path.length - 1)) return [3 /*break*/, 5];
                    newPath = path.slice();
                    newPath.splice(i, 1);
                    if (!(unique(newPath) && same(newPath, input))) return [3 /*break*/, 4];
                    return [4 /*yield*/, newPath];
                case 2:
                    _a.sent();
                    return [5 /*yield**/, __values(optimize(newPath, input))];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    }
    function same(path, input) {
        return rootDocument.querySelector(selector(path)) === input;
    }

    });

    var finder = unwrapExports(dist);

    // tslint:enable
    function isEventTarget(input) {
        return !!(input.addEventListener && input.removeEventListener && input.dispatchEvent);
    }
    function resolveEventTargetSelector(selector) {
        if (selector === '@window') {
            return [window];
        }
        if (selector === '@document') {
            return [document];
        }
        return Array.from(document.querySelectorAll(selector));
    }
    function generateEventTargetSelector(eventTarget) {
        if (eventTarget === window) {
            return '@window';
        }
        if (eventTarget === document) {
            return '@document';
        }
        if (eventTarget instanceof Element) {
            // Generate a CSS selector for the Element
            return finder(eventTarget);
        }
    }
    // tslint:disable
    // Grabbed from:
    //   https://gist.github.com/leofavre/d029cdda0338d878889ba73c88319295
    /**
     * Returns an array with all DOM elements affected by an event.
     * The function serves as a polyfill for
     * [`Event.composedPath()`](https://dom.spec.whatwg.org/#dom-event-composedpath).
     *
     * @category Event
     * @param {Event} evt The triggered event.
     * @return {Array.<HTMLElement>} The DOM elements affected by the event.
     *
     * @example
     * let domChild = document.createElement("div"),
     * 	domParent = document.createElement("div"),
     * 	domGrandparent = document.createElement("div"),
     * 	body = document.body,
     * 	html = document.querySelector("html");
     *
     * domParent.appendChild(domChild);
     * domGrandparent.appendChild(domParent);
     * body.appendChild(domGrandparent);
     *
     * domChild.addEventListener("click", dealWithClick);
     * const dealWithClick = evt => getEventPath(evt);
     *
     * // when domChild is clicked:
     * // => [domChild, domParent, domGrandparent, body, html, document, window]
     */
    function eventPath(evt) {
        var path = (evt.composedPath && evt.composedPath()) || evt.path, target = evt.target;
        if (path != null) {
            // Safari doesn't include Window, and it should.
            path = (path.indexOf(window) < 0) ? path.concat([window]) : path;
            return path;
        }
        if (target === window) {
            return [window];
        }
        function getParents(node, memo) {
            memo = memo || [];
            var parentNode = node.parentNode;
            if (!parentNode) {
                return memo;
            }
            else {
                return getParents(parentNode, memo.concat([parentNode]));
            }
        }
        return [target]
            .concat(getParents(target))
            .concat([window]);
    }
    // tslint:enable

    var EVENT_PROPERTIES = [
        'type',
        'target',
        'currentTarget',
        'eventPhase',
        'bubbles',
        'cancelable',
        'defaultPrevented',
        'composed',
        'timeStamp',
        'srcElement',
        'returnValue',
        'cancelBubble',
        'path',
        'composedPath',
    ];
    var UI_EVENT_PROPERTIES = ['view', 'detail'];
    function marshalEvent(event, enumeratedProperties) {
        if (enumeratedProperties === void 0) { enumeratedProperties = []; }
        var propertiesToEnumerate = EVENT_PROPERTIES.concat(enumeratedProperties);
        if (event instanceof UIEvent) {
            propertiesToEnumerate = enumeratedProperties.concat(UI_EVENT_PROPERTIES);
        }
        var eventObject = {};
        propertiesToEnumerate.forEach(function (key) {
            eventObject[key] = event[key];
        });
        return marshalObject(eventObject);
    }
    function marshalObject(obj) {
        return JSON.parse(JSON.stringify(obj, function (key, value) {
            if (isEventTarget(value)) {
                return generateEventTargetSelector(value);
            }
            return value;
        }));
    }

    var EventHandler = /** @class */ (function (_super) {
        __extends(EventHandler, _super);
        function EventHandler() {
            var _a;
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.declarations = (_a = {},
                _a[EventHandlingMessage.AddEventListener] = _this._addEventListener,
                _a[EventHandlingMessage.RemoveEventListener] = _this._removeEventListener,
                _a);
            _this.eventManager = new EventManager();
            return _this;
        }
        EventHandler.prototype.createHandler = function (callback, properties, options) {
            return function (event) {
                if (options.preventDefault) {
                    event.preventDefault();
                }
                if (options.stopPropagation) {
                    event.stopPropagation();
                }
                if (options.stopImmediatePropagation) {
                    event.stopImmediatePropagation();
                }
                callback(marshalEvent(event, properties));
            };
        };
        EventHandler.prototype._addEventListener = function (callback, target, eventType, properties, options) {
            return __awaiter(this, void 0, void 0, function () {
                var targets, handler;
                return __generator(this, function (_a) {
                    targets = resolveEventTargetSelector(target);
                    handler = this.createHandler(callback, properties, options);
                    return [2 /*return*/, this.eventManager.addEventListener(eventType, handler, options, targets)];
                });
            });
        };
        EventHandler.prototype._removeEventListener = function (_a, listenerID) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_b) {
                    this.eventManager.removeEventListener(listenerID);
                    return [2 /*return*/];
                });
            });
        };
        return EventHandler;
    }(MessageHandler));

    var index = new Dispatcher('event-handling', EventHandler);

    var KeyHandlingMessage;
    (function (KeyHandlingMessage) {
        KeyHandlingMessage["AddKeyEventListener"] = "ADD_KEY_EVENT_LISTENER";
        KeyHandlingMessage["RemoveKeyEventListener"] = "REMOVE_KEY_EVENT_LISTENER";
    })(KeyHandlingMessage || (KeyHandlingMessage = {}));

    var KEYBOARD_EVENT_PROPERTIES = [
        'key',
        'code',
        'location',
        'ctrlKey',
        'shiftKey',
        'altKey',
        'metaKey',
        'isComposing',
    ];
    var KeyHandler = /** @class */ (function (_super) {
        __extends(KeyHandler, _super);
        function KeyHandler() {
            var _a;
            var _this = _super.call(this) || this;
            _this.declarations = (_a = {},
                _a[KeyHandlingMessage.AddKeyEventListener] = _this._addEventListener,
                _a[KeyHandlingMessage.RemoveKeyEventListener] = _this._removeEventListener,
                _a);
            _this.registeredKeyHandlers = {};
            _this.registeredKeyCodes = {};
            _this.lastUsedID = 0;
            _this.eventManager = new EventManager();
            var keyboardEventHandler = _this._createEventHandler();
            var options = { useCapture: true };
            _this.eventManager.addEventListener('keydown', keyboardEventHandler, options);
            _this.eventManager.addEventListener('keypress', keyboardEventHandler, options);
            _this.eventManager.addEventListener('keyup', keyboardEventHandler, options);
            return _this;
        }
        KeyHandler.prototype._createEventHandler = function () {
            var _this = this;
            return function (event) {
                if (event.defaultPrevented) {
                    // Skip if event is already handled
                    return;
                }
                var matchingKeyCodeSet = _this.registeredKeyCodes[event.key] || [];
                matchingKeyCodeSet.forEach(function (listenerID) {
                    var handlerInfo = _this.registeredKeyHandlers[listenerID] || {};
                    if (handlerInfo.eventType !== event.type) {
                        return;
                    }
                    if (handlerInfo.options && handlerInfo.options.preventDefault) {
                        event.preventDefault();
                    }
                    handlerInfo.callback(marshalEvent(event, KEYBOARD_EVENT_PROPERTIES));
                });
            };
        };
        KeyHandler.prototype._addEventListener = function (callback, target, eventType, keyCode, options) {
            return __awaiter(this, void 0, void 0, function () {
                var id;
                return __generator(this, function (_a) {
                    this.lastUsedID = this.lastUsedID + 1;
                    id = this.lastUsedID;
                    if (!this.registeredKeyHandlers[id]) {
                        this.registeredKeyHandlers[id] = { eventType: eventType, callback: callback, options: options };
                    }
                    if (!this.registeredKeyCodes[keyCode]) {
                        this.registeredKeyCodes[keyCode] = [];
                    }
                    this.registeredKeyCodes[keyCode].push(id);
                    return [2 /*return*/, this.lastUsedID];
                });
            });
        };
        KeyHandler.prototype._removeEventListener = function (_a, listenerID) {
            return __awaiter(this, void 0, void 0, function () {
                var obj, _i, _b, key, index;
                return __generator(this, function (_c) {
                    delete this.registeredKeyHandlers[listenerID];
                    obj = this.registeredKeyCodes;
                    for (_i = 0, _b = Object.keys(obj); _i < _b.length; _i++) {
                        key = _b[_i];
                        index = obj[key].indexOf(listenerID);
                        if (index >= 0) {
                            obj[key].splice(index, 1);
                            break;
                        }
                    }
                    return [2 /*return*/];
                });
            });
        };
        return KeyHandler;
    }(MessageHandler));

    var index$1 = new Dispatcher('key-handling', KeyHandler);

    var LinkHandler = /** @class */ (function (_super) {
        __extends(LinkHandler, _super);
        function LinkHandler() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        LinkHandler.prototype.createHandler = function (callback, properties, options) {
            return function (event) {
                var path = eventPath(event);
                var i = 0;
                var length = path.length;
                var anchor = null;
                // tslint:disable-next-line:no-increment-decrement
                for (i; i < length; i++) {
                    if (path[i].tagName === 'a')
                        anchor = path[i];
                }
                if (!anchor)
                    return;
                var href = anchor && anchor.href;
                if (!href)
                    return;
                event.preventDefault();
                event.stopPropagation();
                if (options.stopImmediatePropagation) {
                    event.stopImmediatePropagation();
                }
                var newHref = { href: anchor.href };
                var obj = marshalObject(newHref);
                callback(obj);
            };
        };
        return LinkHandler;
    }(EventHandler));

    var index$2 = new Dispatcher('link-handling', LinkHandler);

    function createRangeData(range) {
        // Ensure we don't use the Text node, so that it can be properly stringified later on
        var startContainer = range.startContainer instanceof Text ?
            range.startContainer.parentElement : range.startContainer;
        var endContainer = range.endContainer instanceof Text ?
            range.endContainer.parentElement : range.endContainer;
        var startContainerPath = getElementPath(startContainer);
        var endContainerPath = getElementPath(endContainer);
        var rangeData = {
            startOffset: range.startOffset,
            startContainer: startContainerPath,
            endOffset: range.endOffset,
            endContainer: endContainerPath,
        };
        return rangeData;
    }
    function createRangeFromSelection(selection) {
        return createRange(selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset);
    }
    function createRangeFromRangeData(rangeData) {
        var startSelector = createSelectorFromStringArray(rangeData.startContainer);
        var endSelector = createSelectorFromStringArray(rangeData.endContainer);
        var startContainer = document.querySelector(startSelector);
        var endContainer = document.querySelector(endSelector);
        if (!startContainer || !endContainer) {
            console.error('Element was not successfully retrieved with selector');
            return new Range();
        }
        startContainer = getTextNode(startContainer);
        endContainer = getTextNode(endContainer);
        return createRange(startContainer, rangeData.startOffset, endContainer, rangeData.endOffset);
    }
    function createSelectorFromStringArray(array) {
        var selector = '';
        var value = '';
        for (var i = array.length - 1; i >= 0; i -= 1) {
            value = array[i];
            // Ignore custom selectors, such as @window and @document
            if (value.includes('@'))
                continue;
            if (selector.length !== 0)
                selector += ' ';
            selector += value;
        }
        return selector;
    }
    function createRange(startContainer, startOffset, endContainer, endOffset) {
        var range = new Range();
        var position = startContainer.compareDocumentPosition(endContainer);
        var isBackwards = false;
        if (position === 0) {
            isBackwards = startOffset > endOffset;
        }
        if (position === startContainer.DOCUMENT_POSITION_PRECEDING) {
            isBackwards = true;
        }
        var sc = isBackwards ? endContainer : startContainer;
        var so = isBackwards ? endOffset : startOffset;
        var ec = isBackwards ? startContainer : endContainer;
        var eo = isBackwards ? startOffset : endOffset;
        range.setStart(sc, so);
        range.setEnd(ec, eo);
        return range;
    }
    function getTextNode(element) {
        var nodes = element.childNodes;
        var node;
        var textNode = undefined;
        for (var i = 0; i < nodes.length; i += 1) {
            node = nodes[i];
            if (node.nodeType === Node.TEXT_NODE) {
                textNode = node;
                break;
            }
        }
        return textNode;
    }
    function getElementPath(element, elements) {
        var els = elements;
        if (!els) {
            els = [];
        }
        els.push(element);
        var parentEl = element.parentElement;
        // If a parent element exists, run this method again with that parent element
        // Otherwise, return the elements with document and window appended to it
        return parentEl ? getElementPath(parentEl, els) : addDocumentAndWindowToPath(els);
    }
    function addDocumentAndWindowToPath(elements) {
        elements.push(document);
        elements.push(window);
        return elements;
    }

    var SelectionHandler = /** @class */ (function (_super) {
        __extends(SelectionHandler, _super);
        function SelectionHandler() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SelectionHandler.prototype.createHandler = function (callback, properties, options) {
            return function (event) {
                event.preventDefault();
                if (options.stopPropagation) {
                    event.stopPropagation();
                }
                if (options.stopImmediatePropagation) {
                    event.stopImmediatePropagation();
                }
                var selection = window.getSelection();
                var text = selection.toString();
                var isEmpty = text.trim().length === 0;
                if (isEmpty)
                    return;
                var range = createRangeFromSelection(selection);
                selection.removeAllRanges();
                selection.addRange(range);
                var rangeData = createRangeData(range);
                var obj = { text: text, rangeData: rangeData };
                var ret = marshalObject(obj);
                callback(ret);
            };
        };
        return SelectionHandler;
    }(EventHandler));

    var index$3 = new Dispatcher('selection-handling', SelectionHandler);

    var EventHandlingMessage$1;
    (function (EventHandlingMessage) {
        EventHandlingMessage["CreateHighlight"] = "CREATE_HIGHLIGHT";
    })(EventHandlingMessage$1 || (EventHandlingMessage$1 = {}));

    var Highlighter = /** @class */ (function (_super) {
        __extends(Highlighter, _super);
        function Highlighter() {
            var _a;
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.declarations = (_a = {},
                _a[EventHandlingMessage$1.CreateHighlight] = _this._createHighlight,
                _a);
            return _this;
        }
        Highlighter.prototype._createHighlight = function (callback, rangeData, options) {
            return __awaiter(this, void 0, void 0, function () {
                var range, highlights, clientRect, highlight;
                return __generator(this, function (_a) {
                    range = createRangeFromRangeData(rangeData);
                    highlights = document.getElementById('highlights');
                    if (!highlights)
                        highlights = this._createHighlightContainer();
                    clientRect = range.getBoundingClientRect();
                    highlight = this._createHighlightDiv(clientRect);
                    highlights.append(highlight);
                    return [2 /*return*/, 1];
                });
            });
        };
        Highlighter.prototype._createHighlightContainer = function () {
            var div = document.createElement('div');
            div.setAttribute('id', 'highlights');
            document.body.prepend(div);
            return div;
        };
        Highlighter.prototype._createHighlightDiv = function (clientRect) {
            var highlight = document.createElement('div');
            highlight.style.setProperty('position', 'absolute');
            highlight.style.setProperty('background', 'rgba(220, 255, 15, 0.40)');
            highlight.style.setProperty('width', clientRect.width + "px");
            highlight.style.setProperty('height', clientRect.height + "px");
            highlight.style.setProperty('left', clientRect.left + "px");
            highlight.style.setProperty('top', clientRect.top + "px");
            return highlight;
        };
        return Highlighter;
    }(MessageHandler));

    var index$4 = new Dispatcher('highlighting', Highlighter);

    exports.eventHandling = index;
    exports.keyHandling = index$1;
    exports.linkHandling = index$2;
    exports.selectionHandling = index$3;
    exports.highlighting = index$4;

    return exports;

}({}));
//# sourceMappingURL=ReadiumGlue-payload.js.map
