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

// declare var process: any; // Also defined in typescript.d.ts
// declare var global: any; // Also defined in typescript.d.ts
declare var require: any;
    
declare module nw.gui {

	interface EventEmitter {
	    addListener(event: string, listener: Function);
	    on(event: string, listener: Function);
	    once(event: string, listener: Function): void;
	    removeListener(event: string, listener: Function): void;
	    removeAllListener(event: string): void;
	    setMaxListeners(n: number): void;
	    listeners(event: string): { Function; }[];
	    emit(event: string, arg1?: any, arg2?: any): void;
	}
	
	interface MenuConfig {
		type?:string;
	}

	interface Menu {
		new(config?:MenuConfig);		
		items: MenuItem[];		
		append(item:MenuItem);
		remove(item:MenuItem);
		insert(item:MenuItem, atPosition:number);
		removeAt(index:number);
		popup(x:number,y:number);

	}


	interface MenuItemConfig {
		label?:string;
		click?:Function;
		type?:string;
		submenu?:Menu;
		icon?:string;
		tooltip?:string;
		checked?:boolean;
		enabled?:boolean;		
	}

	interface MenuItem extends MenuItemConfig, EventEmitter {
		new(config:MenuItemConfig);
	}

	interface IWindow {
		menu:Menu;
		showDevTools();	
        on(event:string,handler:Function);
        close(force:boolean);
	}

	var MenuItem:MenuItem;
	var Menu:Menu
	var Window: { 
        get() : IWindow; 
        open(url:string, options):IWindow;
    };
	var App : {
        argv: any;  
        closeAllWindows();
        quit();
	}
}