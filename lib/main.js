var HashHandler = ace.require('ace/keyboard/hash_handler').HashHandler;
var AutoCompleteView = (function () {
    function AutoCompleteView(editor) {
        this.editor = editor;
        this.handler = new HashHandler();
        this.active = false;
        this.init();
        this.initKeys();
        this.editor.container.appendChild(this.wrap);
        this.listElement.innerHTML = '';
    }
    AutoCompleteView.selectedClassName = 'autocomplete_selected';
    AutoCompleteView.className = 'autocomplete';
    AutoCompleteView.prototype.init = function () {
        this.wrap = document.createElement('div');
        this.listElement = document.createElement('ul');
        this.wrap.className = AutoCompleteView.className;
        this.wrap.appendChild(this.listElement);
    };
    AutoCompleteView.prototype.getInputText = function () {
        var cursor = this.editor.getCursorPosition();
        var text = this.editor.session.getLine(cursor.row).slice(0, cursor.column + 1);
        console.log("input text:" + text);
        var matches = text.match(/[a-zA-Z_0-9\$]*$/);
        if(matches && matches[0]) {
            return matches[0];
        } else {
            return "";
        }
    };
    AutoCompleteView.prototype.getInputText2 = function () {
        var pos = this.editor.getCursorPosition();
        var result = this.editor.getSession().getTokenAt(pos.row, pos.column);
        if(result && result.value) {
            return result.value.trim();
        } else {
            return "";
        }
    };
    AutoCompleteView.prototype.filter = function () {
        var text = this.getInputText();
        if(!text) {
            return this.completions;
        }
        console.log("filter: " + text);
        var result = this.completions.filter(function (entry) {
            return (entry.name.indexOf(text) === 0);
        });
        return result;
    };
    AutoCompleteView.prototype.initKeys = function () {
        var _this = this;
        this.handler.bindKey("Down", function () {
            _this.focusNext();
        });
        this.handler.bindKey("Up", function () {
            _this.focusPrev();
        });
        this.handler.bindKey("Esc", function () {
            _this.hide();
        });
        this.handler.bindKey("Return|Tab", function () {
            var current = _this.current();
            if(current) {
                var inputText = _this.getInputText();
                for(var i = 0; i < inputText.length; i++) {
                    _this.editor.remove("left");
                }
                _this.editor.insert(current.dataset["name"]);
            }
            _this.hide();
        });
    };
    AutoCompleteView.prototype.show = function () {
        var _this = this;
        this.editor.keyBinding.addKeyboardHandler(this.handler);
        this.wrap.style.display = 'block';
        this.changeListener = function (ev) {
            return _this.onChange(ev);
        };
        this.editor.getSession().on("change", this.changeListener);
        this.active = true;
    };
    AutoCompleteView.prototype.hide = function () {
        this.editor.keyBinding.removeKeyboardHandler(this.handler);
        this.wrap.style.display = 'none';
        this.editor.getSession().removeListener('change', this.changeListener);
        this.active = false;
    };
    AutoCompleteView.prototype.onChange = function (ev) {
        var key = ev.data.text;
        if(" -=,[]_/()!';:<>".indexOf(key) !== -1) {
            this.hide();
            return;
        }
        this.render();
    };
    AutoCompleteView.prototype.render = function () {
        this.listElement.innerHTML = "";
        var infos = this.filter();
        if(infos.length > 0) {
            var html = '';
            for(var n in infos) {
                var info = infos[n];
                var kindClass = "kind-" + info.kind;
                var name = '<span class="name ' + kindClass + '">' + info.name + '</span>';
                var type = "";
                if(info.name !== info.type) {
                    type = '<span class="type">' + info.type + '</span>';
                }
                html += '<li data-name="' + info.name + '">' + name + type + '</li>';
            }
            this.listElement.innerHTML = html;
            this.ensureFocus();
        }
    };
    AutoCompleteView.prototype.showCompletions = function (completions) {
        if(this.active) {
            return;
        }
        this.completions = completions;
        console.log("Received completions: " + completions.length);
        var cursor = this.editor.getCursorPosition();
        var coords = this.editor.renderer.textToScreenCoordinates(cursor.row, cursor.column);
        this.setPosition(coords);
        this.render();
        this.show();
    };
    AutoCompleteView.prototype.setPosition = function (coords) {
        var bottom, editorBottom, top;
        top = coords.pageY + 20;
        editorBottom = $(this.editor.container).offset().top + $(this.editor.container).height();
        bottom = top + $(this.wrap).height();
        if(bottom < editorBottom) {
            this.wrap.style.top = top + 'px';
            return this.wrap.style.left = coords.pageX + 'px';
        } else {
            this.wrap.style.top = (top - $(this.wrap).height() - 20) + 'px';
            return this.wrap.style.left = coords.pageX + 'px';
        }
    };
    AutoCompleteView.prototype.current = function () {
        var child, children, i;
        children = this.listElement.childNodes;
        for(i in children) {
            child = children[i];
            if(child.className === AutoCompleteView.selectedClassName) {
                return child;
            }
        }
        return null;
    };
    AutoCompleteView.prototype.focusNext = function () {
        var curr, focus;
        curr = this.current();
        focus = curr.nextSibling;
        if(focus) {
            curr.className = '';
            focus.className = AutoCompleteView.selectedClassName;
            return this.adjustPosition();
        }
    };
    AutoCompleteView.prototype.focusPrev = function () {
        var curr, focus;
        curr = this.current();
        focus = curr.previousSibling;
        if(focus) {
            curr.className = '';
            focus.className = AutoCompleteView.selectedClassName;
            return this.adjustPosition();
        }
    };
    AutoCompleteView.prototype.ensureFocus = function () {
        if(!this.current()) {
            var element = this.listElement.firstChild;
            if(element) {
                element.className = AutoCompleteView.selectedClassName;
                return this.adjustPosition();
            }
        }
    };
    AutoCompleteView.prototype.adjustPosition = function () {
        var elm, elmOuterHeight, newMargin, pos, preMargin, wrapHeight;
        elm = this.current();
        if(elm) {
            newMargin = '';
            wrapHeight = $(this.wrap).height();
            elmOuterHeight = $(elm).outerHeight();
            preMargin = $(this.listElement).css("margin-top").replace('px', '');
            preMargin = parseInt(preMargin);
            pos = $(elm).position();
            if(pos.top >= (wrapHeight - elmOuterHeight)) {
                newMargin = (preMargin - elmOuterHeight) + 'px';
                $(this.listElement).css("margin-top", newMargin);
            }
            if(pos.top < 0) {
                newMargin = (-pos.top + preMargin) + 'px';
                return $(this.listElement).css("margin-top", newMargin);
            }
        }
    };
    return AutoCompleteView;
})();
var cats;
(function (cats) {
    var ISenseHandler = (function () {
        function ISenseHandler() {
            this.messageId = 0;
            this.registry = {
            };
            this.worker = new Worker("./lib/tsworker.js");
            this.init();
        }
        ISenseHandler.prototype.perform = function (method) {
            var data = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                data[_i] = arguments[_i + 1];
            }
            var handler = data.pop();
            this.messageId++;
            var message = {
                id: this.messageId,
                method: method,
                params: data
            };
            this.worker.postMessage(message);
            if(handler) {
                this.registry[this.messageId] = handler;
            }
        };
        ISenseHandler.prototype.clear = function () {
            this.registry = {
            };
        };
        ISenseHandler.prototype.init = function () {
            var _this = this;
            this.worker.onmessage = function (e) {
                var msg = e.data;
                if(msg.error) {
                    console.error("Got error back !!! ");
                    console.error(msg.error.stack);
                }
                var id = msg.id;
                if(id) {
                    var handler = _this.registry[id];
                    if(handler) {
                        delete _this.registry[id];
                        handler(msg.error, msg.result);
                    }
                } else {
                    console.log(msg);
                }
            };
        };
        return ISenseHandler;
    })();
    cats.ISenseHandler = ISenseHandler;    
})(cats || (cats = {}));
function errorHandler(err, data) {
    if(err) {
        console.log(err);
        alert("Error occured, check console logging");
    }
}
var cats;
(function (cats) {
    var fs = require("fs")
    var path = require("path")
    var Configuration = (function () {
        function Configuration(projectRoot) {
            var fileName = path.join(projectRoot, Configuration.NAME);
            var dir = path.dirname(fileName);
            fs.exists(dir, function (exists) {
                if(!exists) {
                    fs.mkdirSync(dir);
                    console.log("created .setting directory");
                }
            });
        }
        Configuration.NAME = ".settings" + path.sep + "config.json";
        Configuration.prototype.load = function () {
            try  {
                var content = cats.project.readTextFile(Configuration.NAME);
                this._config = JSON.parse(content);
            } catch (err) {
                console.log("Couldn't load project configuration, loading defaults");
                this.loadDefault();
            }
        };
        Configuration.prototype.config = function () {
            return this._config;
        };
        Configuration.prototype.stringify = function () {
            var result = JSON.stringify(this._config, null, 4);
            return result;
        };
        Configuration.prototype.loadDefault = function () {
            this._config = {
                theme: "clouds",
                fontSize: "14px",
                main: "index.html",
                sourcePath: null,
                outputPath: null,
                compiler: {
                    useDefaultLib: true,
                    outputMany: true,
                    outputFileName: "main.js",
                    emitComments: false,
                    generateDeclarationFiles: false,
                    mapSourceFiles: false,
                    codeGenTarget: 1,
                    moduleGenTarget: 0
                },
                minify: false,
                rememberOpenFiles: false
            };
        };
        return Configuration;
    })();
    cats.Configuration = Configuration;    
})(cats || (cats = {}));
var cats;
(function (cats) {
    var path = require("path")
    var EditSession = ace.require("ace/edit_session").EditSession;
    var UndoManager = ace.require("ace/undomanager").UndoManager;
    var Session = (function () {
        function Session(project, name, content) {
            this.project = project;
            this.name = name;
            this.enableAutoComplete = false;
            this.pendingWorkerUpdate = false;
            this._changed = false;
            console.log("Creating new session for file " + name + " with content length " + content.length);
            var ext = path.extname(name);
            this.editSession = new EditSession(content, this.getMode(ext));
            if(ext === ".ts") {
                this.enableAutoComplete = true;
            }
            this.editSession.on("change", this.onChangeHandler.bind(this));
            this.editSession.setUndoManager(new UndoManager());
        }
        Session.MODES = {
            ".js": "ace/mode/javascript",
            ".ts": "ace/mode/typescript",
            ".xhtml": "ace/mode/html",
            ".xhtm": "ace/mode/html",
            ".html": "ace/mode/html",
            ".htm": "ace/mode/html",
            ".css": "ace/mode/css",
            ".less": "ace/mode/less",
            ".md": "ace/mode/markdown",
            ".svg": "ace/mode/svg",
            ".yaml": "ace/mode/yaml",
            ".yml": "ace/mode/yaml",
            ".xml": "ace/mode/xml",
            ".json": "ace/mode/json"
        };
        Object.defineProperty(Session.prototype, "changed", {
            get: function () {
                return this._changed;
            },
            set: function (value) {
                if(this._changed !== value) {
                    this._changed = value;
                    cats.tabbar.refresh();
                }
            },
            enumerable: true,
            configurable: true
        });
        Session.prototype.getValue = function () {
            return this.editSession.getValue();
        };
        Session.convertMember = function convertMember(member) {
            var result = member.prefix;
            if(member.entries) {
                for(var i = 0; i < member.entries.length; i++) {
                    result += this.convertMember(member.entries[i]);
                }
            } else {
                result += member.text;
            }
            result += member.suffix;
            return result;
        }
        Session.prototype.getPositionFromScreenOffset = function (x, y) {
            var r = this.project.editor.renderer;
            var offset = (x + r.scrollLeft - r.$padding) / r.characterWidth;
            var correction = r.scrollTop ? 7 : 0;
            var row = Math.floor((y + r.scrollTop - correction) / r.lineHeight);
            var col = Math.round(offset);
            var docPos = this.editSession.screenToDocumentPosition(row, col);
            return docPos;
        };
        Session.prototype.getPositionFromScreen = function (x, y) {
            var r = this.project.editor.renderer;
            var canvasPos = r.rect || (r.rect = r.scroller.getBoundingClientRect());
            var offset = (x + r.scrollLeft - canvasPos.left - r.$padding) / r.characterWidth;
            var row = Math.floor((y + r.scrollTop - canvasPos.top) / r.lineHeight);
            var col = Math.round(offset);
            var docPos = this.editSession.screenToDocumentPosition(row, col);
            return docPos;
        };
        Session.prototype.showInfoAt = function (ev) {
            if(!this.enableAutoComplete) {
                return;
            }
            var docPos = this.getPositionFromScreenOffset(ev.offsetX, ev.offsetY);
            var project = this.project;
            project.iSense.perform("getTypeAtPosition", this.name, docPos, function (err, data) {
                if(!data) {
                    return;
                }
                var member = data.memberName;
                if(!member) {
                    return;
                }
                var tip = Session.convertMember(member);
                project.toolTip.show(ev.x, ev.y, tip);
            });
        };
        Session.prototype.getMode = function (ext) {
            var result = Session.MODES[ext];
            if(!result) {
                result = "ace/mode/text";
            }
            return result;
        };
        Session.prototype.autoComplete = function (cursor, view) {
            if(!this.enableAutoComplete) {
                return;
            }
            var editSession = this.editSession;
            if(this.pendingWorkerUpdate) {
                var source = editSession.getValue();
                this.project.iSense.perform("updateScript", this.name, source, function (err, result) {
                    editSession.setAnnotations(result);
                });
                this.pendingWorkerUpdate = false;
            }
            ; ;
            this.project.iSense.perform("autoComplete", cursor, this.name, function (err, completes) {
                if(completes != null) {
                    view.showCompletions(completes.entries);
                }
            });
        };
        Session.prototype.onChangeHandler = function (event) {
            var _this = this;
            this.changed = true;
            if(!this.enableAutoComplete) {
                return;
            }
            this.pendingWorkerUpdate = true;
            clearTimeout(this.updateSourceTimer);
            this.updateSourceTimer = setTimeout(function () {
                if(_this.pendingWorkerUpdate) {
                    console.log("updating source code for file " + _this.name);
                    var source = _this.editSession.getValue();
                    _this.project.iSense.perform("updateScript", _this.name, source, function (err, result) {
                        _this.editSession.setAnnotations(result);
                    });
                    _this.pendingWorkerUpdate = false;
                }
            }, 1000);
        };
        return Session;
    })();
    cats.Session = Session;    
})(cats || (cats = {}));
var Menu;
(function (Menu) {
    var gui = require('nw.gui')
    var win = gui.Window.get();
    function getCursor() {
        return cats.project.editor.getCursorPosition();
    }
    function gotoDeclaration() {
        var cursor = getCursor();
        var fileName = cats.project.session.name;
        cats.project.iSense.perform("getDefinitionAtPosition", fileName, cursor, function (err, data) {
            if(data && data.unitName) {
                cats.project.editFile(data.unitName, null, data.startPos);
            }
        });
    }
    Menu.gotoDeclaration = gotoDeclaration;
    function rangeToPosition(range) {
        return (range.startRow + 1) + ":" + (range.startColumn + 1);
    }
    function getInfoAt(type) {
        var cursor = getCursor();
        var fileName = cats.project.session.name;
        $("#result").addClass("busy");
        cats.project.iSense.perform("getInfoAtPosition", type, fileName, cursor, function (err, data) {
            $("#result").removeClass("busy");
            if(data) {
                document.getElementById("result").innerHTML = "";
                var grid = new cats.ui.Grid();
                grid.setColumns([
                    "description", 
                    "script", 
                    "position"
                ]);
                grid.setRows(data);
                grid.setAspect("position", function (row) {
                    return rangeToPosition(row.range);
                });
                grid.render();
                grid.appendTo(document.getElementById("result"));
                grid.onselect = function (data) {
                    cats.project.editFile(data.script, null, {
                        row: data.range.startRow,
                        column: data.range.startColumn
                    });
                };
            }
        });
    }
    Menu.getInfoAt = getInfoAt;
    var EditorContextMenu = (function () {
        function EditorContextMenu(project) {
            this.project = project;
            this.ctxmenu = new gui.Menu();
            this.ctxmenu.append(new gui.MenuItem({
                label: 'Goto Declaration',
                click: gotoDeclaration
            }));
            this.ctxmenu.append(new gui.MenuItem({
                label: 'Get References',
                click: function () {
                    getInfoAt("getReferencesAtPosition");
                }
            }));
            this.ctxmenu.append(new gui.MenuItem({
                label: 'Get Occurences',
                click: function () {
                    getInfoAt("getOccurrencesAtPosition");
                }
            }));
            this.ctxmenu.append(new gui.MenuItem({
                label: 'Get Implementors',
                click: function () {
                    getInfoAt("getImplementorsAtPosition");
                }
            }));
        }
        EditorContextMenu.prototype.bindTo = function (elem) {
            var _this = this;
            elem.oncontextmenu = function (ev) {
                ev.preventDefault();
                if(_this.project.session.enableAutoComplete) {
                    _this.lastEvent = ev;
                    _this.ctxmenu.popup(ev.x, ev.y);
                }
                return false;
            };
        };
        return EditorContextMenu;
    })();
    Menu.EditorContextMenu = EditorContextMenu;    
})(Menu || (Menu = {}));
var cats;
(function (cats) {
    (function (ui) {
        var ToolTip = (function () {
            function ToolTip() {
                this.element = this.createElement();
            }
            ToolTip.prototype.show = function (x, y, tip) {
                this.element.innerText = tip;
                var st = this.element.style;
                st.left = (x + 10).toString(10) + "px";
                st.top = (y + 10).toString(10) + "px";
                st.display = "block";
            };
            ToolTip.prototype.hide = function () {
                this.element.style.display = "none";
            };
            ToolTip.prototype.createElement = function () {
                var tooltipNode = document.createElement("div");
                document.documentElement.appendChild(tooltipNode);
                var st = tooltipNode.style;
                st.position = "fixed";
                st.display = "none";
                st.background = "#ffffca";
                st.color = "#000023";
                st.borderRadius = "";
                st.border = "1px solid gray";
                st.padding = "1px";
                st.zIndex = "1000";
                st.fontFamily = "monospace";
                st.whiteSpace = "pre-line";
                return tooltipNode;
            };
            return ToolTip;
        })();
        ui.ToolTip = ToolTip;        
    })(cats.ui || (cats.ui = {}));
    var ui = cats.ui;
})(cats || (cats = {}));
var cats;
(function (cats) {
    (function (ui) {
        var fs = require("fs")
        var path = require("path")
        function sort(a, b) {
            if((!a.isFolder) && b.isFolder) {
                return 1;
            }
            if(a.isFolder && (!b.isFolder)) {
                return -1;
            }
            if(a.name > b.name) {
                return 1;
            }
            if(b.name > a.name) {
                return -1;
            }
            return 0;
        }
        var FileTree = (function () {
            function FileTree(rootDir) {
                this.rootDir = rootDir;
                var _this = this;
                var list = [
                    {
                        name: path.basename(rootDir),
                        path: "",
                        isFolder: true
                    }
                ];
                this.rootElem = this.render(list);
                this.rootElem.onclick = function (ev) {
                    ev.stopPropagation();
                    _this.toggle(ev.srcElement);
                };
            }
            FileTree.COLLAPSED = "collapsed";
            FileTree.OPENED = "opened";
            FileTree.prototype.appendTo = function (elem) {
                elem.appendChild(this.rootElem);
            };
            FileTree.prototype.render = function (list) {
                var ul = document.createElement("ul");
                list.forEach(function (entry) {
                    var li = document.createElement("li");
                    li.innerText = entry.name;
                    li.dataset.path = entry.path;
                    if(entry.isFolder) {
                        li.className = FileTree.COLLAPSED;
                        li.dataset.isFolder = true;
                    }
                    ul.appendChild(li);
                });
                return ul;
            };
            FileTree.prototype.toggle = function (li) {
                var _this = this;
                if(!li.dataset.isFolder) {
                    if(this.onselect) {
                        this.onselect(li.dataset.path);
                    }
                    return;
                }
                if(li.className === FileTree.OPENED) {
                    li.className = FileTree.COLLAPSED;
                    li.removeChild(li.childNodes[1]);
                    return;
                }
                li.className = FileTree.OPENED;
                var dir = li.dataset.path;
                var fullDirName = path.join(this.rootDir, dir);
                var files = fs.readdirSync(fullDirName);
                var entries = [];
                files.forEach(function (file) {
                    var pathName = path.join(dir, file);
                    var fullName = path.join(_this.rootDir, pathName);
                    entries.push({
                        name: file,
                        path: pathName,
                        isFolder: fs.statSync(fullName).isDirectory()
                    });
                });
                entries.sort(sort);
                var ul = this.render(entries);
                li.appendChild(ul);
            };
            return FileTree;
        })();
        ui.FileTree = FileTree;        
    })(cats.ui || (cats.ui = {}));
    var ui = cats.ui;
})(cats || (cats = {}));
var cats;
(function (cats) {
    var fs = require("fs")
    var path = require("path")
    var Project = (function () {
        function Project(projectDir) {
            this.sessions = [];
            this.loadDefaultLib = true;
            cats.project = this;
            this.toolTip = new cats.ui.ToolTip();
            this.projectDir = path.resolve(projectDir);
            this.config = new cats.Configuration(this.projectDir);
            this.config.load();
            this.editor = this.createEditor();
            this.setTheme(this.config.config().theme);
            this.editor.setFontSize("16px");
            this.autoCompleteView = new AutoCompleteView(this.editor);
            this.hideEditor();
            this.iSense = new cats.ISenseHandler();
            if(this.loadDefaultLib) {
                var libdts = fs.readFileSync("typings/lib.d.ts", "utf8");
                this.iSense.perform("addScript", "lib.d.ts", libdts, true, null);
            }
            this.loadTypeScriptFiles("");
            this.assimilate();
            this.editorContextMenu = new Menu.EditorContextMenu(this);
            this.editorContextMenu.bindTo(document.getElementById("editor"));
        }
        Project.prototype.assimilate = function () {
            setTimeout(function () {
                var isDark = $(".ace_dark").length > 0;
                var fg = isDark ? "white" : "black";
                var elem = $(".ace_scroller");
                var bg = elem.css("background-color");
                $("html, #main, #navigator, #info, #result").css("background-color", bg);
                $("html").css("color", fg);
                $(".autocomplete").css("background-color", bg);
                $(".autocomplete").css("color", fg);
                $("input").css("background-color", fg);
                $("input").css("color", bg);
            }, 500);
        };
        Project.prototype.setTheme = function (theme) {
            this.editor.setTheme("ace/theme/" + theme);
            this.assimilate();
        };
        Project.prototype.saveFile = function () {
            if(this.session.name === "untitled") {
                this.session.name = prompt("Please enter the file name") || "untitled";
            }
            if(this.session.name !== "untitled") {
                this.writeSession(this.session);
                this.session.changed = false;
            }
        };
        Project.prototype.getSession = function (name) {
            for(var i = 0; i < this.sessions.length; i++) {
                var session = this.sessions[i];
                if(session.name === name) {
                    return session;
                }
            }
        };
        Project.prototype.autoComplete = function () {
            if(this.session.enableAutoComplete) {
                var cursor = this.editor.getCursorPosition();
                this.session.autoComplete(cursor, this.autoCompleteView);
            }
        };
        Project.prototype.showEditor = function () {
            document.getElementById("editor").style.display = "block";
            this.editor.focus();
        };
        Project.prototype.hideEditor = function () {
            document.getElementById("editor").style.display = "none";
        };
        Project.prototype.closeSession = function (session) {
            if(session.changed) {
                var c = confirm("Save " + session.name + " before closing ?");
                if(c) {
                    this.writeSession(session);
                }
            }
            var index = this.sessions.indexOf(session);
            this.sessions.splice(index, 1);
            if(this.session === session) {
                this.session === null;
                this.hideEditor();
            }
            cats.tabbar.refresh();
        };
        Project.prototype.close = function () {
            var _this = this;
            this.sessions.forEach(function (session) {
                if(session.changed) {
                    var c = confirm("Save " + session.name + " before closing ?");
                    if(c != null) {
                        _this.writeSession(session);
                    }
                }
                ; ;
            });
            this.sessions.length = 0;
            this.session = null;
            this.hideEditor();
            cats.tabbar.refresh();
        };
        Project.prototype.onMouseMove = function (ev) {
            var _this = this;
            this.toolTip.hide();
            clearTimeout(this.mouseMoveTimer);
            this.mouseMoveTimer = setTimeout(function () {
                _this.session.showInfoAt(ev);
            }, 200);
        };
        Project.prototype.createEditor = function () {
            var _this = this;
            var editor = ace.edit("editor");
            editor.getSession().setMode("ace/mode/typescript");
            editor.commands.addCommands([
                {
                    name: "autoComplete",
                    bindKey: {
                        mac: "Command-Space",
                        win: "Ctrl-Space"
                    },
                    exec: this.autoComplete.bind(this)
                }, 
                {
                    name: "save",
                    bindKey: {
                        mac: "Command-s",
                        win: "Ctrl-s"
                    },
                    exec: this.saveFile.bind(this)
                }
            ]);
            var originalTextInput = editor.onTextInput;
            editor.onTextInput = function (text) {
                originalTextInput.call(editor, text);
                if(text === ".") {
                    _this.autoComplete();
                }
            };
            var elem = document.getElementById("editor");
            elem.onmousemove = this.onMouseMove.bind(this);
            elem.onmouseout = function () {
                _this.toolTip.hide();
            };
            return editor;
        };
        Project.prototype.editFile = function (name, content, goto) {
            var session = this.getSession(name);
            if(!session) {
                if(content == null) {
                    content = this.readTextFile(name);
                }
                session = new cats.Session(this, name, content);
                this.sessions.push(session);
                this.editor.setSession(session.editSession);
                if(goto) {
                    this.editor.moveCursorTo(goto.row, goto.column);
                } else {
                    this.editor.moveCursorTo(0, 0);
                }
                if(session.enableAutoComplete) {
                    this.iSense.perform("updateScript", name, content, function (err, result) {
                        session.editSession.setAnnotations(result);
                    });
                }
            } else {
                this.editor.setSession(session.editSession);
                this.iSense.perform("getErrors", name, function (err, result) {
                    session.editSession.setAnnotations(result);
                });
                if(goto) {
                    this.editor.moveCursorTo(goto.row, goto.column);
                    this.editor.clearSelection();
                }
            }
            this.session = session;
            this.showEditor();
            cats.tabbar.refresh();
        };
        Project.prototype.getFullName = function (name) {
            return path.join(this.projectDir, name);
        };
        Project.prototype.writeTextFile = function (name, value) {
            fs.writeFileSync(this.getFullName(name), value, "utf8");
        };
        Project.prototype.writeSession = function (session) {
            this.writeTextFile(session.name, session.getValue());
        };
        Project.prototype.readTextFile = function (name) {
            if(name === "untitled") {
                return "";
            }
            var data = fs.readFileSync(this.getFullName(name), "utf8");
            var content = data.replace(/\r\n?/g, "\n");
            return content;
        };
        Project.prototype.loadTypeScriptFiles = function (directory) {
            var _this = this;
            var files = fs.readdirSync(this.getFullName(directory));
            files.forEach(function (file) {
                var fullName = path.join(directory, file);
                var stats = fs.statSync(_this.getFullName(fullName));
                if(stats.isFile()) {
                    var ext = path.extname(file);
                    if(ext === ".ts") {
                        var content = _this.readTextFile(fullName);
                        _this.iSense.perform("updateScript", fullName, content, function () {
                        });
                        console.log("Found TypeScript file: " + fullName);
                    }
                }
                if(stats.isDirectory()) {
                    _this.loadTypeScriptFiles(fullName);
                }
            });
        };
        return Project;
    })();
    cats.Project = Project;    
})(cats || (cats = {}));
var cats;
(function (cats) {
    (function (ui) {
        var Grid = (function () {
            function Grid() {
                this.aspects = {
                };
                this.defaultHandler = function (row, name) {
                    return row[name];
                };
                this.rootElement = document.createElement("table");
            }
            Grid.prototype.setColumns = function (columns) {
                this.columns = columns;
            };
            Grid.prototype.setRows = function (rows) {
                this.rows = rows;
            };
            Grid.prototype.setAspect = function (aspect, handler) {
                this.aspects[aspect] = handler;
            };
            Grid.prototype.getValue = function (row, columnName) {
                var fn = this.aspects[columnName] || this.defaultHandler;
                return fn(row, columnName);
            };
            Grid.prototype.getLabel = function (headerName) {
                return headerName;
            };
            Grid.prototype.appendTo = function (elem) {
                elem.appendChild(this.rootElement);
            };
            Grid.prototype.createHeader = function () {
                var _this = this;
                var head = this.rootElement.createTHead();
                var row = head.insertRow(-1);
                this.columns.forEach(function (header) {
                    var th = document.createElement("th");
                    th.innerText = _this.getLabel(header);
                    row.appendChild(th);
                });
            };
            Grid.prototype.createRow = function (parent, rowData) {
                var _this = this;
                var row = parent.insertRow(-1);
                this.columns.forEach(function (column) {
                    row.insertCell(-1).innerText = _this.getValue(rowData, column);
                });
                row["_value"] = rowData;
                var self = this;
                row.onclick = function () {
                    if(self.onselect) {
                        self.onselect(this["_value"]);
                    }
                };
            };
            Grid.prototype.render = function () {
                var _this = this;
                var table = this.rootElement;
                table.innerHTML = "";
                this.createHeader();
                var tbody = document.createElement("tbody");
                table.appendChild(tbody);
                this.rows.forEach(function (row) {
                    _this.createRow(tbody, row);
                });
            };
            return Grid;
        })();
        ui.Grid = Grid;        
    })(cats.ui || (cats.ui = {}));
    var ui = cats.ui;
})(cats || (cats = {}));
var Menu;
(function (Menu) {
    var gui = require('nw.gui')
    var win = gui.Window.get();
    function createHeader(table, headers) {
        var head = table.createTHead();
        var row = head.insertRow(-1);
        headers.forEach(function (header) {
            var th = document.createElement("th");
            th.innerText = header;
            row.appendChild(th);
        });
    }
    function errorStringToStructure(errStr) {
        var result = [];
        var errors = errStr.split("\n");
        errors.forEach(function (error) {
            error = error.trim();
            if(!error) {
                return;
            }
            var match = /^(.*)\(([0-9]*),([0-9]*)\):(.*)$/g;
            var parts = match.exec(error);
            if(!parts) {
                console.error("Couldn't parse error:" + error);
                return;
            }
            result.push({
                description: parts[4],
                resource: parts[1].trim(),
                row: parseInt(parts[2], 10) - 1,
                column: parseInt(parts[3], 10) - 1
            });
        });
        return result;
    }
    function showErrors(errStr) {
        var errors = errorStringToStructure(errStr);
        var grid = new cats.ui.Grid();
        grid.setColumns([
            "description", 
            "resource", 
            "position"
        ]);
        grid.setAspect("position", function (data) {
            return (data.row + 1) + ":" + (data.column + 1);
        });
        grid.setRows(errors);
        grid.onselect = function (data) {
            cats.project.editFile(data.resource, null, {
                row: data.row,
                column: data.column
            });
        };
        grid.render();
        var result = document.getElementById("result");
        result.innerHTML = "";
        grid.appendTo(result);
    }
    var Menubar = (function () {
        function Menubar() {
            this.fontSizes = [
                10, 
                12, 
                14, 
                16, 
                18, 
                20
            ];
            this.themes = [
                {
                    theme: "chrome",
                    label: "Chrome"
                }, 
                {
                    theme: "clouds",
                    label: "Clouds"
                }, 
                {
                    theme: "crimson_editor",
                    label: "Crimson Editor"
                }, 
                {
                    theme: "dawn",
                    label: "Dawn"
                }, 
                {
                    theme: "dreamweaver",
                    label: "Dreamweaver"
                }, 
                {
                    theme: "eclipse",
                    label: "Eclipse"
                }, 
                {
                    theme: "github",
                    label: "GitHub"
                }, 
                {
                    theme: "solarized_light",
                    label: "Solarized Light"
                }, 
                {
                    theme: "textmate",
                    label: "TextMate"
                }, 
                {
                    theme: "tomorrow",
                    label: "Tomorrow"
                }, 
                {
                    theme: "xcode",
                    label: "XCode"
                }, 
                {
                    theme: null,
                    label: "seperator dark themes"
                }, 
                {
                    theme: "ambiance",
                    label: "Ambiance"
                }, 
                {
                    theme: "clouds_midnight",
                    label: "Clouds Midnight"
                }, 
                {
                    theme: "cobalt",
                    label: "Cobalt"
                }, 
                {
                    theme: "idle_fingers",
                    label: "idleFingers"
                }, 
                {
                    theme: "kr_theme",
                    label: "krTheme"
                }, 
                {
                    theme: "merbivore",
                    label: "Merbivore"
                }, 
                {
                    theme: "merbivore_soft",
                    label: "Merbivore Soft"
                }, 
                {
                    theme: "mono_industrial",
                    label: "Mono Industrial"
                }, 
                {
                    theme: "monokai",
                    label: "Monokai"
                }, 
                {
                    theme: "pastel_on_dark",
                    label: "Pastel on dark"
                }, 
                {
                    theme: "solarized_dark",
                    label: "Solarized Dark"
                }, 
                {
                    theme: "twilight",
                    label: "Twilight"
                }, 
                {
                    theme: "tomorrow_night",
                    label: "Tomorrow Night"
                }, 
                {
                    theme: "tomorrow_night_blue",
                    label: "Tomorrow Night Blue"
                }, 
                {
                    theme: "tomorrow_night_bright",
                    label: "Tomorrow Night Bright"
                }, 
                {
                    theme: "tomorrow_night_eighties",
                    label: "Tomorrow Night 80s"
                }, 
                {
                    theme: "vibrant_ink",
                    label: "Vibrant Ink"
                }, 
                
            ];
            var menubar = new gui.Menu({
                type: 'menubar'
            });
            var file = new gui.Menu();
            file.append(new gui.MenuItem({
                label: 'New File',
                click: this.newFile
            }));
            file.append(new gui.MenuItem({
                type: "separator"
            }));
            file.append(this.editorCommand("save"));
            file.append(new gui.MenuItem({
                label: 'Save As ...',
                click: this.nop
            }));
            file.append(new gui.MenuItem({
                label: 'Save All',
                click: this.nop
            }));
            file.append(new gui.MenuItem({
                type: "separator"
            }));
            file.append(new gui.MenuItem({
                label: 'Close File',
                click: this.closeFile
            }));
            file.append(new gui.MenuItem({
                label: 'Close All Files',
                click: this.closeAllFiles
            }));
            file.append(new gui.MenuItem({
                type: "separator"
            }));
            file.append(new gui.MenuItem({
                label: 'Exit',
                click: this.closeAllProjects
            }));
            var edit = new gui.Menu();
            edit.append(this.editorCommand("undo"));
            edit.append(this.editorCommand("redo"));
            edit.append(new gui.MenuItem({
                type: "separator"
            }));
            edit.append(this.editorCommand("cut"));
            edit.append(this.editorCommand("copy"));
            edit.append(this.editorCommand("paste"));
            edit.append(new gui.MenuItem({
                type: "separator"
            }));
            edit.append(this.editorCommand("find"));
            edit.append(this.editorCommand("findnext"));
            edit.append(this.editorCommand("findprevious"));
            edit.append(this.editorCommand("replace"));
            edit.append(this.editorCommand("replaceall"));
            edit.append(new gui.MenuItem({
                label: 'Find/Replace...',
                click: this.nop
            }));
            edit.append(new gui.MenuItem({
                type: "separator"
            }));
            edit.append(this.editorCommand("togglerecording"));
            edit.append(this.editorCommand("replaymacro"));
            var source = new gui.Menu();
            source.append(this.editorCommand("togglecomment"));
            source.append(this.editorCommand("indent"));
            source.append(this.editorCommand("outdent"));
            source.append(new gui.MenuItem({
                label: 'Format code',
                click: this.formatText
            }));
            var refactor = new gui.Menu();
            refactor.append(new gui.MenuItem({
                label: 'Rename',
                click: this.nop
            }));
            var navigate = new gui.Menu();
            navigate.append(new gui.MenuItem({
                label: 'Open Declaration',
                click: Menu.gotoDeclaration
            }));
            navigate.append(new gui.MenuItem({
                label: 'Find References',
                click: function () {
                    Menu.getInfoAt("getReferencesAtPosition");
                }
            }));
            navigate.append(new gui.MenuItem({
                label: 'Find Occurences',
                click: function () {
                    Menu.getInfoAt("getOccurrencesAtPosition");
                }
            }));
            navigate.append(new gui.MenuItem({
                label: 'Find Implementors',
                click: function () {
                    Menu.getInfoAt("getImplementorsAtPosition");
                }
            }));
            var proj = new gui.Menu();
            proj.append(new gui.MenuItem({
                label: 'Open Project...',
                click: this.openProject
            }));
            proj.append(new gui.MenuItem({
                label: 'Close Project',
                click: this.closeProject
            }));
            proj.append(new gui.MenuItem({
                type: "separator"
            }));
            proj.append(new gui.MenuItem({
                label: 'Build Project',
                click: this.compileAll
            }));
            var run = new gui.Menu();
            run.append(new gui.MenuItem({
                label: 'Run main',
                click: this.runFile
            }));
            run.append(new gui.MenuItem({
                label: 'Debug main',
                click: this.nop
            }));
            var window = new gui.Menu();
            window.append(new gui.MenuItem({
                label: 'Theme',
                submenu: this.createThemeMenu()
            }));
            window.append(new gui.MenuItem({
                label: 'Font size',
                submenu: this.createFontSizeMenu()
            }));
            window.append(new gui.MenuItem({
                label: 'Preferences',
                click: this.preferences
            }));
            var help = new gui.Menu();
            help.append(new gui.MenuItem({
                label: 'Keyboard shortcuts',
                click: this.showShortcuts
            }));
            help.append(new gui.MenuItem({
                label: 'Process Info',
                click: this.showProcess
            }));
            help.append(new gui.MenuItem({
                label: 'Developers tools',
                click: this.showDevTools
            }));
            help.append(new gui.MenuItem({
                label: 'About CATS',
                click: this.showAbout
            }));
            menubar.append(new gui.MenuItem({
                label: 'File',
                submenu: file
            }));
            menubar.append(new gui.MenuItem({
                label: 'Edit',
                submenu: edit
            }));
            menubar.append(new gui.MenuItem({
                label: 'Source',
                submenu: source
            }));
            menubar.append(new gui.MenuItem({
                label: 'Refactor',
                submenu: refactor
            }));
            menubar.append(new gui.MenuItem({
                label: 'Navigate',
                submenu: navigate
            }));
            menubar.append(new gui.MenuItem({
                label: 'Project',
                submenu: proj
            }));
            menubar.append(new gui.MenuItem({
                label: 'Run',
                submenu: run
            }));
            menubar.append(new gui.MenuItem({
                label: 'Window',
                submenu: window
            }));
            menubar.append(new gui.MenuItem({
                label: 'Help',
                submenu: help
            }));
            win.menu = menubar;
            this.menubar = menubar;
        }
        Menubar.prototype.getLabelForCommand = function (commandName) {
            var label = commandName[0].toUpperCase() + commandName.slice(1);
            var platform = cats.project.editor.commands.platform;
            var command = cats.project.editor.commands.byName[commandName];
            var tabs = 5 - Math.floor((label.length / 4) - 0.01);
            label = label + "\t\t\t\t\t\t".substring(0, tabs);
            if(command && command.bindKey) {
                var key = command.bindKey[platform];
                if(key) {
                    label += key;
                }
            }
            return label;
        };
        Menubar.prototype.editorCommand = function (commandName) {
            var label = this.getLabelForCommand(commandName);
            var item = new gui.MenuItem({
                label: label,
                click: function () {
                    cats.project.editor.execCommand(commandName);
                }
            });
            return item;
        };
        Menubar.prototype.showShortcuts = function () {
            window.open('static/html/keyboard_shortcuts.html', '_blank');
        };
        Menubar.prototype.showAbout = function () {
            alert("Code Assisitant for TypeScript\nversion 0.6.8\nCreated by JBaron");
        };
        Menubar.prototype.closeAllProjects = function () {
            var sure = confirm("Do you really want to quit?");
            if(sure) {
                gui.App.closeAllWindows();
            }
        };
        Menubar.prototype.showDevTools = function () {
            win.showDevTools();
        };
        Menubar.prototype.newFile = function () {
            cats.project.editFile("untitled", "");
        };
        Menubar.prototype.closeFile = function () {
            cats.project.closeSession(cats.project.session);
        };
        Menubar.prototype.closeAllFiles = function () {
            cats.project.close();
        };
        Menubar.prototype.closeProject = function () {
            window.close();
        };
        Menubar.prototype.quit = function () {
            var sure = confirm("Do you really want to quit?");
            if(sure) {
                gui.App.quit();
            }
        };
        Menubar.prototype.showProcess = function () {
            var mem = process.memoryUsage();
            var display = "memory used: " + mem.heapUsed;
            display += "\nmemory total: " + mem.heapTotal;
            display += "\nplatform: " + process.platform;
            display += "\nworking directory: " + process.cwd();
            alert(display);
        };
        Menubar.prototype.compileAll = function () {
            var options = cats.project.config.config().compiler;
            $("#result").addClass("busy");
            cats.project.iSense.perform("compile", options, function (err, data) {
                $("#result").removeClass("busy");
                if(data.error) {
                    showErrors(data.error);
                    return;
                }
                document.getElementById("result").innerText = "Successfully generated " + Object.keys(data.source).length + " file(s).";
                var sources = data.source;
                for(var name in sources) {
                    cats.project.writeTextFile(name, sources[name]);
                }
            });
        };
        Menubar.prototype.preferences = function () {
            var content = cats.project.config.stringify();
            var name = cats.Configuration.NAME;
            cats.project.editFile(name, content);
        };
        Menubar.prototype.openProject = function () {
            var chooser = document.getElementById('fileDialog');
            chooser.onchange = function (evt) {
                console.log(this.value);
                var param = encodeURIComponent(this.value);
                window.open('index.html?project=' + param, '_blank');
            };
            chooser.click();
        };
        Menubar.prototype.formatText = function () {
            var session = cats.project.session;
            cats.project.iSense.perform("getFormattedTextForRange", session.name, 0, session.getValue().length, function (err, result) {
                if(!err) {
                    cats.project.session.editSession.setValue(result);
                }
            });
        };
        Menubar.prototype.saveFile = function () {
            cats.project.editor.execCommand("save");
        };
        Menubar.prototype.runFile = function () {
            var path = require("path");
            var main = cats.project.config.config().main;
            if(!main) {
                alert("Please specify the main html file to run in the project settings.");
                return;
            }
            var startPage = "file://" + cats.project.getFullName(main);
            console.log("Opening file: " + startPage);
            var win2 = gui.Window.open(startPage, {
                toolbar: true,
                webkit: {
                    "page-cache": false
                }
            });
        };
        Menubar.prototype.nop = function () {
            alert("Not yet implemented");
        };
        Menubar.prototype.undoChange = function () {
            var man = cats.project.editor.getSession().getUndoManager();
            man.undo();
        };
        Menubar.prototype.redoChange = function () {
            var man = cats.project.editor.getSession().getUndoManager();
            man.redo();
        };
        Menubar.prototype.enableFind = function () {
            window.open('static/html/findreplace.html', '_blank');
        };
        Menubar.prototype.actionFind = function () {
            var input = document.getElementById("findText");
            cats.project.editor.find(input.value, {
            }, true);
        };
        Menubar.prototype.actionReplace = function () {
            var findText = document.getElementById("findText");
            var replaceText = document.getElementById("replaceText");
            var options = {
                needle: findText.value
            };
            cats.project.editor.replace(replaceText.value, options);
        };
        Menubar.prototype.setThemeWrapper = function (theme) {
            return function setTheme() {
                cats.project.setTheme(theme);
            }
        };
        Menubar.prototype.createFontSizeMenu = function () {
            var menu = new gui.Menu();
            this.fontSizes.forEach(function (size) {
                menu.append(new gui.MenuItem({
                    label: size + "px",
                    click: function () {
                        cats.project.editor.setFontSize(size + "px");
                    }
                }));
            });
            return menu;
        };
        Menubar.prototype.createThemeMenu = function () {
            var _this = this;
            var menu = new gui.Menu();
            this.themes.forEach(function (theme) {
                if(theme.theme) {
                    menu.append(new gui.MenuItem({
                        label: theme.label,
                        click: _this.setThemeWrapper(theme.theme)
                    }));
                } else {
                    menu.append(new gui.MenuItem({
                        type: "separator"
                    }));
                }
            });
            return menu;
        };
        Menubar.prototype.enableReplace = function () {
            document.getElementById("findArea").style.display = "block";
            document.getElementById("replaceArea").style.display = "block";
        };
        return Menubar;
    })();    
    Menu.mainMenuBar;
    function createMenuBar() {
        Menu.mainMenuBar = new Menubar();
    }
    Menu.createMenuBar = createMenuBar;
})(Menu || (Menu = {}));
var Menu;
(function (Menu) {
    var fs = require("fs")
    var path = require("path")
    function nop() {
        alert("Not yet implemented");
    }
    ; ;
    var gui = require('nw.gui')
    var win = gui.Window.get();
    function createFileContextMenu() {
        var ctxmenu = new gui.Menu();
        ctxmenu.append(new gui.MenuItem({
            label: 'Rename',
            click: rename
        }));
        ctxmenu.append(new gui.MenuItem({
            label: 'New file',
            click: newFile
        }));
        ctxmenu.append(new gui.MenuItem({
            label: 'Delete',
            click: deleteFile
        }));
        return ctxmenu;
    }
    var fileContextMenu = createFileContextMenu();
    function deleteFile() {
        var sure = confirm("Delete " + data.key);
        if(sure) {
            var fullName = cats.project.getFullName(data.key);
            fs.unlinkSync(fullName);
        }
    }
    function newFile() {
        var basedir;
        if(data.isFolder) {
            basedir = data.key;
        } else {
            basedir = path.dirname(data.key);
        }
        var name = prompt("Enter new file name ");
        if(name == null) {
            return;
        }
        var fullName = path.join(basedir, name);
        cats.project.writeTextFile(fullName, "");
    }
    function rename() {
        var name = prompt("Enter new name", data.key);
        if(name == null) {
            return;
        }
        var c = confirm("Going to rename " + data.key + " into " + name);
        if(c) {
            var root = cats.project.projectDir;
            try  {
                fs.renameSync(path.join(root, data.key), path.join(root, name));
            } catch (err) {
                alert(err);
            }
        }
    }
    var data = {
        key: "",
        isFolder: true
    };
    document.getElementById("filetree").addEventListener('contextmenu', function (ev) {
        data.key = ev.srcElement.dataset.path;
        data.isFolder = ev.srcElement.dataset.isFolder;
        console.log(data.key);
        ev.preventDefault();
        fileContextMenu.popup(ev.x, ev.y);
        return false;
    });
})(Menu || (Menu = {}));
var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var cats;
(function (cats) {
    (function (ui) {
        var SingleSelector = (function () {
            function SingleSelector() {
                this.options = [];
                this.aspects = {
                };
            }
            SingleSelector.prototype.addOption = function (obj) {
                this.options.push({
                    value: obj
                });
            };
            SingleSelector.prototype.setOptions = function (arr) {
                this.options = arr;
            };
            SingleSelector.prototype.setAspect = function (name, aspect) {
                this.aspects[name] = aspect;
            };
            SingleSelector.prototype.getAspect = function (name, obj) {
                var aspect = this.aspects[name];
                if(aspect == null) {
                    return obj[name];
                } else {
                    if(typeof (aspect) === "function") {
                        return aspect(obj);
                    }
                    return obj[aspect];
                }
            };
            SingleSelector.prototype.select = function (obj, notify) {
                if (typeof notify === "undefined") { notify = false; }
                this.selected = obj;
            };
            SingleSelector.prototype.removeOption = function (obj) {
                this.options.forEach(function (option) {
                });
            };
            SingleSelector.prototype.refresh = function () {
            };
            return SingleSelector;
        })();
        ui.SingleSelector = SingleSelector;        
        var Tabbar = (function (_super) {
            __extends(Tabbar, _super);
            function Tabbar() {
                        _super.call(this);
                this.counter = 0;
                this.root = document.createElement("ul");
                this.root.onclick = this.onClickHandler.bind(this);
            }
            Tabbar.instances = {
            };
            Tabbar.counter = 0;
            Tabbar.nr = 0;
            Tabbar.prototype.render = function () {
                var _this = this;
                this.root.innerHTML = "";
                this.options.forEach(function (option) {
                    var optionElem = document.createElement("li");
                    optionElem["_value"] = option;
                    optionElem.innerText = _this.getAspect("name", option);
                    var longName = _this.getAspect("longname", option);
                    if(longName) {
                        optionElem.setAttribute("title", longName);
                    }
                    var selected = _this.getAspect("selected", option);
                    if(selected === true) {
                        optionElem.className = "active";
                    }
                    var changed = _this.getAspect("changed", option);
                    if(changed === true) {
                        optionElem.className += " changed";
                    }
                    _this.root.appendChild(optionElem);
                });
            };
            Tabbar.prototype.refresh = function () {
                this.render();
            };
            Tabbar.prototype.appendTo = function (elem) {
                this.render();
                elem.appendChild(this.root);
            };
            Tabbar.prototype.select = function (obj, notify) {
                if (typeof notify === "undefined") { notify = false; }
                var _this = this;
                _super.prototype.select.call(this, obj);
                this.options.forEach(function (option) {
                    if(option.value === _this.selected) {
                        option.elem.className = "active";
                    } else {
                        option.elem.className = "";
                    }
                });
            };
            Tabbar.prototype.getSelectedOption = function (ev) {
                var elem = ev.srcElement;
                return elem["_value"];
            };
            Tabbar.prototype.onClickHandler = function (ev) {
                if(this.onselect) {
                    var option = this.getSelectedOption(ev);
                    this.onselect(option);
                }
            };
            return Tabbar;
        })(SingleSelector);
        ui.Tabbar = Tabbar;        
        function test() {
            var users = [
                {
                    name: "john",
                    age: 12
                }, 
                {
                    name: "peter",
                    age: 15
                }, 
                {
                    name: "marry",
                    age: 18
                }, 
                
            ];
            var tb = new Tabbar();
            tb.setOptions(users);
            tb.onselect = function (user) {
                alert("User selected");
            };
        }
    })(cats.ui || (cats.ui = {}));
    var ui = cats.ui;
})(cats || (cats = {}));
var cats;
(function (cats) {
    cats.project;
    
    var path = require("path")
    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.search);
        if(results == null) {
            return "";
        } else {
            return decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    }
    function getParamByName(name) {
        var querystring = require("querystring");
        var params = querystring.parse(window.location.search);
        return params[name];
    }
    var defaultProject = "./samples" + path.sep + "greeter";
    cats.project = new cats.Project(getParameterByName("project") || defaultProject);
    Menu.createMenuBar();
    var fileTree = new cats.ui.FileTree(cats.project.projectDir);
    fileTree.appendTo(document.getElementById("filetree"));
    fileTree.onselect = function (filePath) {
        cats.project.editFile(filePath);
    };
    cats.tabbar;
    cats.tabbar = new cats.ui.Tabbar();
    cats.tabbar.setOptions(cats.project.sessions);
    cats.tabbar.setAspect("name", function (session) {
        return path.basename(session.name);
    });
    cats.tabbar.setAspect("selected", function (session) {
        return session === cats.project.session;
    });
    cats.tabbar.setAspect("longname", function (session) {
        return session.name;
    });
    cats.tabbar.setAspect("changed", function (session) {
        return session.changed;
    });
    cats.tabbar.onselect = function (session) {
        return cats.project.editFile(session.name);
    };
    cats.tabbar.appendTo(document.getElementById("sessionbar"));
    $(document).ready(function () {
        $('body').layout({
            applyDemoStyles: false,
            spacing_open: 8
        });
    });
    var gui = require('nw.gui');
    var win = gui.Window.get();
    win.on("close", function () {
        cats.project.close();
        if(win != null) {
            win.close(true);
        }
        this.close(true);
    });
})(cats || (cats = {}));