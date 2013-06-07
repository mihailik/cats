//
// Copyright (c) JBaron.  All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//


// This module contains all the global commands pertaining to the help functionality
module Cats.Commands {

    /**
     * Show the available keyboard shortcuts
     */ 
    function showShortcuts() {
        window.open('keyboard_shortcuts.html', '_blank');
    }

    /**
     * Show the version of CATS
     */ 
    function showAbout() {
        alert("Code Assisitant for TypeScript\nversion 0.9.0.alpha\nCreated by JBaron");
    }

    /**
     * Open the webkit developers tools for debugging etc.
     */ 
    function showDevTools() {        
        GUI.Window.get().showDevTools();
    }

    /**
     * Show process info like current memory usage
     */ 
    function showProcess() {
            var mem = (<any>process).memoryUsage();
            var display = "memory used: " + mem.heapUsed;
            display += "\nmemory total: " + mem.heapTotal;
            display += "\nplatform: " + process.platform;
            display += "\nworking directory: " + (<any>process).cwd();
            alert(display);
    }

    export class HelpCommands {
        static init(registry) {
            registry({name:CMDS.help_about, label:"About", command:showAbout});
            registry({name:CMDS.help_devTools, label:"Developer Tools", command:showDevTools});
            registry({name:CMDS.help_shortcuts, label:"Shortcuts", command:showShortcuts});
            registry({name:CMDS.help_processInfo, label:"Process Info", command: showProcess});
        }

    }

}