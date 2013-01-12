
module Cats.Menu {


    function nop() {
        alert("Not yet implemented");
    };

    function createFileContextMenu() {
        // Create an empty menu
        var ctxmenu = new gui.Menu();
        // Add some items
        ctxmenu.append(new gui.MenuItem({ label: 'Rename', click: rename }));
        ctxmenu.append(new gui.MenuItem({ label: 'New file', click: newFile }));
        ctxmenu.append(new gui.MenuItem({ label: 'Delete', click: deleteFile }));
        return ctxmenu;
    }



    function deleteFile() {
        var sure = confirm("Delete " + data.key);
        if (sure) {            
            fs.unlinkSync(data.key);
        }
    }

    function newFile() {
        var basedir;

        if (data.isFolder) {
            basedir = data.key
        } else {
            basedir = path.dirname(data.key);
        }

        var name = prompt("Enter new file name ");
        if (name == null) return;
        var fullName = path.join(basedir, name);
        Cats.project.writeTextFile(fullName, "");
    }


    function rename() {
        var name = prompt("Enter new name", data.key);
        if (name == null) return;
        var c = confirm("Going to rename " + data.key + " into " + name);
        if (c) {
            var root = Cats.project.projectDir;
            try {
                fs.renameSync(path.join(root, data.key), path.join(root, name));
            } catch (err) {
                alert(err);
            }
        }
    }

    var data = {
        key: "",
        isFolder: true
    }

    var fileContextMenu = createFileContextMenu();

    IDE.fileNavigation.addEventListener('contextmenu', function(ev: any) {
        var d = UI.TreeView.getValueFromElement(ev.srcElement);
        data.key = d.path;
        data.isFolder = d.isFolder;
        // console.log(data.key);
        ev.preventDefault();
        fileContextMenu.popup(ev.x, ev.y);
        return false;
    });


}