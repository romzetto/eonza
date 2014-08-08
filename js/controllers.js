geapp.controller('UploadCtrl', function ($scope, $fileUploader) {
        'use strict';
        // create a uploader with options
        var uploader = $scope.uploader = $fileUploader.create({
            scope: $scope,                          // to automatically update the html. Default: $rootScope
            url: ajax( 'upload' ),
            removeAfterUpload: true,
            formData: [],
            queueLimit: 100
        });
        // ADDING FILTERS
        uploader.filters.push(function(item /*{File|HTMLInput}*/) { // user filter
            if ( item.size > 10*1024*1024 ) {
                var text = lng['err_filesize'].replace( '#temp#', '10 Mb' );
                rootScope.msg_warning( text );
                return false;
            }
//            console.info('filter1');
            return true;
        });
        rootScope.uploads.push( uploader );
        // REGISTER HANDLERS
/*        uploader.bind('afteraddingfile', function (event, item) {
            console.info('After adding a file', item);
        });

        uploader.bind('whenaddingfilefailed', function (event, item) {
            console.info('When adding a file failed', item);
        });

        uploader.bind('afteraddingall', function (event, items) {
            console.info('After adding all files', items);
        });
*/
        uploader.bind('beforeupload', function (event, item) {
            item.formData.push( {idcol : item.idcol, iditem: 
                          angular.isDefined( uploader.iditem ) ? uploader.iditem : rootScope.curitem } );
           // console.info('Before upload', item);
        });

/*        uploader.bind('progress', function (event, item, progress) {
            console.info('Progress: ' + progress, item);
        });

        uploader.bind('success', function (event, xhr, item, response) {
            console.info('Success', xhr, item, response);
        });

        uploader.bind('cancel', function (event, xhr, item) {
            console.info('Cancel', xhr, item);
        });

        uploader.bind('error', function (event, xhr, item, response) {
//            item.remove();
//            console.info('Error', xhr, item, response);
        });
*/
        uploader.bind('complete', function (event, xhr, item, response) {
            if ( uploader.queue.length == 1 && angular.isDefined( uploader.iditem ))
                uploader.iditem = undefined;
//            console.info('Complete', xhr, item, response);
            if ( !response.success )
                rootScope.msg_error( response.err );
            else {
                if ( response.iditem == rootScope.curitem )
                {
                    Scope.form[ response.alias ] = response.result;
                    Scope.$apply();
                }
            }
        });
/*
        uploader.bind('progressall', function (event, progress) {
            console.info('Total progress: ' + progress);
        });

        uploader.bind('completeall', function (event, items) {
//            console.info('Complete all', items);
        });
*/
        // -------------------------------
        var controller = $scope.controller = {
            isImage: function(item) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|gif|'.indexOf(type) !== -1;
            }
        };

 });


geapp.controller( 'IndexCtrl', function IndexCtrl($scope, $http, $routeSegment ) {
    $scope.menu = [
        { title: lng.tables, icon: 'table', href: '#/', name: 'tables'},
        { title: lng.sets, icon: 'list-alt', href: '#/sets', name: 'sets'},
        { title: lng.menu, icon: 'th-list', href: '#/menu', name: 'menu'},
        { title: lng.settings, icon: 'cogs', href: '#/appsettings', name: 'appsettings'},
    ];
    $scope.$routeSegment = $routeSegment;
//    $state.transitionTo('index.menu');
//    $state.go('index.menu');
});

geapp.controller( 'InstallCtrl', function InstallCtrl($scope, $http ) {
    $scope.langlist = langlist;
    $scope.form = { dbhost: 'localhost',
                    storage: cfg.appenter + 'storage' };
    $scope.submit = function() {
        $http.post( cfg.appdir + 'ajax/waccess.php', { path: cfg.appenter }).success(function(data) {
            if ( data.success )
            {
                $http.post( cfg.appdir + 'ajax/install.php', { form: $scope.form, 
                    lang: $scope.lng.code, path: cfg.appenter }).success(function(data) {
                    if ( data.success )
                    {
                        cfg.user = data.user;
                        document.location = '#/';
                    }
                    else
                    {
                        cfg.temp = data.temp;
                        $scope.msg_error( $scope.lng[ data.err ] + ( data.err == 'err_system' ? 
                                         ' [' + data.code + ']' : '' ) );
                    }
                })
            }
            else
            {
                cfg.temp = data.temp;
                $scope.msg_error( $scope.lng[ data.err ] + ( data.err == 'err_system' ? 
                             ' [' + data.code + ']' : '' ) );
            }
        })
    }
});

geapp.controller( 'LoginCtrl', function LoginCtrl($scope, $http ) {
    $scope.form = {};
    $scope.submit = function() {
        $http.post( /*'/admin/ajax.php?request=login'*/ajax('login'), { form: $scope.form }).success(function(data) {
            if ( data.success )
            {
                document.location = '';
            }
            else
                $scope.msg_error( $scope.lng[ data.err ] );
        })
    }
});

geapp.controller( 'SettingsCtrl', function SettingsCtrl( $scope, DbApi, $rootScope ) {
    $scope.langlist = langlist;
    $scope.form = { title: cfg.title, login: cfg.user.login, email: cfg.user.email, apitoken: cfg.apitoken };    
    $scope.language = function()
    {
        DbApi( 'saveusr', { lang: $scope.form.lang }, function( data ) {
                        $scope.$parent.changelng( $scope.form.lang ) });
    }
});

function TablesCtrl($scope, $rootScope, $routeSegment, DbApi ) {
    $scope.$routeSegment = $routeSegment;
    $scope.isalias = cfg.isalias;
    $scope.parent = angular.isDefined( $routeSegment.$routeParams.id ) ? $routeSegment.$routeParams.id : 0;
    $scope.droptable = function( index ) {
        cfg.temp = $scope.items[ index].title;
        $rootScope.msg_quest( $scope.items[ index].isfolder == 1 ? 'delfld':'deldb', function(){ 
            DbApi( 'droptable', { id: $scope.items[index].id }, function( data ) {
                $scope.items.splice( index, 1 ) });
            });
        return false;
    }
    $scope.export2set = function( index ) {
        cfg.temp = ' ' + lng.export2set +' ' + $scope.items[ index].title;
        $rootScope.msg_quest( 'sure', function(){ 
            DbApi( 'export2set', { id: $scope.items[index].id }, function( data ) {
                if ( data.success )
                {
                    document.location = '#/set?id=' + data.success;
                } });
            });
        return false;
    }
    $scope.truncate = function( index ) {
        cfg.temp = $scope.items[ index].title;
        $rootScope.msg_quest( 'truncatedb', function(){ 
            DbApi( 'truncatetable', { id: $scope.items[index].id }, function( data ) {
                document.location = '#/table?id=' + data.success;
            });
         });
        return false;
    }
    $scope.importdata = function( newval, callback ) {
        $rootScope.form.importdata = newval;
        callback();
    }
    $scope.duplicate = function( index ) {
        $rootScope.form = { importdata: 1, id: $scope.items[ index].id, 
                            source: $scope.items[ index].title,
                            dest: $scope.items[ index].title + ' - ' + lng.copysuf };
        $rootScope.msg( { title: lng.duplicate, template: tpl('tabledup.html'),
                   btns: [ {text: lng.duplicate, func: function(){
                         DbApi( 'duptable', $rootScope.form, function( data ) {
                            if ( data.success )
                                document.location = '#/editable?id='+ data.success;
                        })             
                   }, class: 'btn-primary btn-near' },
                           {text: lng.cancel, class: 'btn-default btn-near' }
               ]  });
    }
    $scope.changefld = function( index ) {
        DbApi( 'gettree', { dbname: 'tables', id: $scope.items[ index].id }, function( data ) {
            if ( data.success )
            {
                $rootScope.tablefld = data.result;
                $rootScope.form = { idparent: $scope.items[ index].idparent, id: $scope.items[ index].id,
                                      dbname: 'tables' };
                $rootScope.msg( { title: lng.changefld, template: tpl('changefld.html'),
                   btns: [ {text: lng.save, func: function(){
                         DbApi( 'changefld', $rootScope.form, function( data ) {
                            if ( data.success )
                                document.location = '#\?id='+ $rootScope.form.idparent;
                        })             
                   }, class: 'btn-primary btn-near' },
                           {text: lng.cancel, class: 'btn-default btn-near' }
               ]  })
            }
        })
    }
    $scope.savefolder = function() {
        if ( $rootScope.form.title == '' )
        {
            $rootScope.msg_warning('war_ename');
            return false;
        }
        DbApi( 'savefolder', $scope.form, function( data ) {
            if ( data.success )
                if ( $rootScope.form.id )
                    $scope.items[$rootScope.form.index].title = data.result.title;
                else
                    document.location = '#/?id=' + data.success;
        });
        //alert($rootScope.form.cur);
    }
    $scope.editfolder = function( index ) {
        var add = angular.isUndefined( index );
        function foldermsg() {
           $rootScope.msg( { title: add ? lng.newfld : lng.editfld, template: tpl('dlgfolder.html'),
                   btns: [ {text: add ? lng.add : lng.save, func: $scope.savefolder, class: 'btn-primary btn-near' },
                           {text: lng.cancel, class: 'btn-default btn-near' }
               ]  })
        }
        if ( add )
        {
            DbApi( 'gettree', { dbname: 'tables' }, function( data ) {
                if ( data.success )
                {
                    $rootScope.tablefld = data.result;
                    $rootScope.form = {title: '', idparent: $scope.parent, id: 0 };
                    foldermsg();
                }
            })
        }
        else
        {
            obj = $scope.items[index];
            $rootScope.form = {title: obj.title, idparent: obj.idparent, id: obj.id,
                                index: index };
            foldermsg();
        }
    }
    DbApi( 'gettables', { parent: $scope.parent }, function( data ) {
        $scope.items = data.result;
        if ( angular.isDefined( data.crumbs ))
        {
            $scope.crumbs = [{ id:0, title: $rootScope.lng.rootfolder }].concat( data.crumbs );
        }
        else
            $scope.crumbs = [];
    });
}

function TableCtrl($scope, $routeSegment, DbApi, $rootScope, $sce /*, $cookies*/ ) {
    $scope.$routeSegment = $routeSegment;
    $scope.allselect = false;
    $scope.mode = cnt.M_LIST;   
    $scope.currow = 0; // the index of the current item
    $scope.offset = 0; // offset of the first item
    $scope.allcount = 0; // summary count 
    $rootScope.curitem = 0; // the latest current item (id)
    Scope = $scope;
    $rootScope.uploads = [];
    $scope.params = $routeSegment.$routeParams;
    if ( angular.isUndefined( $scope.params.p ))
        $scope.params.p = 1;
    $scope.listitems = '';
    $scope.edititems = '';
    $scope.viewitems = '';
//    $scope.cookies= $cookies;

    $rootScope.cheditform = function( obj, callback ) {
        for(var k in obj)
        {
            $scope.form[k] = obj[k];
            break;
        }
        callback();
    }
    $scope.treemode = function() {
        if ( angular.isDefined( $scope.params.parent ))
        {
            $scope.params.parent = undefined;
            $scope.crumbs = [];
        }
        else
            $scope.params.parent = 0;
        $scope.update();
    }
    $scope.treechange = function( id ) {
        Scope.params.parent = id;
        Scope.update();
    }
    $scope.columns = function() {
        DbApi( 'columns', $scope.params, function( data ) {
            if ( data.success )
            {
                $scope.db = data.db;
                $scope.columns = data.columns;
                var i = 0;
                $scope.collist = [];
                $scope.colnames = {};
                var listitems = '';
                var viewitems = '';
                while ( i <  $scope.columns.length )
                {
                    var column = $scope.columns[i];
                    if ( column.idtype == cnt.FT_PARENT )
                        column.title = lng.parent;
                    column.number = angular.isDefined( types[column.idtype].number );
                    column.class += $rootScope.aligns[ column.align] + ' ';
                    if ( parseInt( column.visible ) > 0 )
                        $scope.collist.push( column );
                    $scope.colnames[ column.alias ] = column;
                    listitems += js_editpattern( i, $scope.columns );
                    viewitems += js_viewpattern( i, $scope.columns );
                    i++;
                }
                $scope.listitems = listitems + js_editpatternbottom();
                $scope.viewitems = viewitems + js_viewpatternbottom();
                $scope.update();
            }
        });
    }
    $scope.pstnew = function( action ){
        $rootScope.postnew = action;
    }
    $scope.pstedit = function( action ){
        $rootScope.postedit = action;
    }
/*    $scope.clearuploads = function() {
        for ( i = 0; i < $rootScope.uploads.length; i++ )
        {
            $rootScope.uploads[i].clearQueue();   
        }
    }*/
    $scope.delfile = function( id ) {
        $rootScope.msg_quest( 'delattach', function(){ 
            DbApi( 'delfile', {id: id}, function( data ) {
                if ( data.success )
                    $scope.form[ data.alias ] = data.result;
            })
        })
        return false;
    }
    $scope.linkpage = function( direct ) {
        var offset = direct == 0 ? 0 : Scope.link.offset + direct*15;
        DbApi( 'getlink', {offset: offset, id: Scope.columns[ rootScope.idlink ].id,
                   search: rootScope.link.search, 
                   filter: rootScope.link.filter, parent: Scope.link.parent }, 
                 function( data ) {
            if ( data.success )
            {
                Scope.columns[ rootScope.idlink ].link = data.result;
                rootScope.link = Scope.columns[ rootScope.idlink ].link;
            }
        })
    }
    $scope.linkparent = function( parent ) {
        Scope.link.parent = parent;
        $scope.linkpage( 0 );
    }
    $scope.editlink = function( idcol ) {
        $rootScope.link = $scope.columns[idcol].link;
        $rootScope.link.filter = 0;
        $rootScope.idlink = idcol;  
        if ( parseInt( $scope.columns[idcol].extend.filter ) > 0 )
        {
            for ( var i = 0; i < $scope.columns.length; i++ )
                if ( angular.isDefined( $scope.columns[i].extend.table ) &&
                     parseInt($scope.columns[i].extend.table) == parseInt( $scope.columns[idcol].extend.filter ))
                {
                    if ( $scope.form[ $scope.columns[i].alias ] == 0 )                    
                    {
                        cfg.temp = $scope.columns[i].title;
                        $rootScope.msg_warning( 'war_efilter' );
                        return false;
                    }
                    else
                    {
                        $rootScope.link.filter = parseInt( $scope.form[ $scope.columns[i].alias ] ) + ':' +
                                                    parseInt($scope.columns[idcol].extend.filtercol);
                        $scope.linkpage( 0 );
                    }
                }
        }
        $rootScope.msg( {  title: $scope.columns[idcol].title, template: tpl('editlink.html'),
                       btns: 
                       [ {text: lng.clear, func: function(){
                                var alias = $scope.columns[idcol].alias;
                                $scope.form[ alias ] = 0;
                                $scope.formlink[ alias ] = '';
                                $scope.view[ alias ] = '';
                       }, class: 'btn-default btn-near' },
                       {text: lng.close, class: 'btn-primary btn-near' } ] });
        return false;
    }    
    $scope.editfile = function( id ) {
        var i = 0;
        var form = ( $scope.mode == cnt.M_EDIT ? $scope.form : $scope.view );
        var data;
        while ( i <  $scope.columns.length && angular.isUndefined( data ))
        {
            var column = $scope.columns[i];
            if ( column.idtype == cnt.FT_FILE || column.idtype == cnt.FT_IMAGE )
            {
                for ( var k = 0; k < form[ column.alias ].length; k++ )
                    if ( form[ column.alias ][k].id == id )
                    {
                        data = form[ column.alias ][k];
                        break;
                    }    
            }
            i++;
        }
        if ( angular.isDefined( data ))
        {
            $rootScope.form = data;//angular.copy( data );
            $rootScope.msg( { title: lng.fileinfo, template: tpl('editfile.html'),
                       btns: $scope.mode == cnt.M_EDIT ?
                       [ {text: lng.save, func: function(){
                             DbApi( 'editfile', $rootScope.form, function( data ) {
                                if ( data.success )
                                {
                                    //data = $rootScope.form;
                                }
                            })             
                       }, class: 'btn-primary btn-near' },
                               {text: lng.cancel, class: 'btn-default btn-near' }
                   ] : [ {text: lng.close, class: 'btn-primary btn-near' }
                   ] });
        }
        return false;
    }
    $scope.saveitem = function(){
        var iclass = angular.isDefined( cfg.htmleditor ) ? cfg.htmleditor.class : 'redactor';
        $( "."+iclass ).each( function() {
            var attr = $(this).attr('name');
            var value = '';
            if ( angular.isDefined( cfg.htmleditor ))
                value = CKEDITOR.instances['id-'+attr].getData();
            else
                value = $(this).redactor('get' );
            $scope.form[ attr ] = value;
        })
        DbApi( 'saveitem', $scope.form, function( data ) {
            if ( data.success )
            {
                $rootScope.curitem = data.success;
                $scope.form = data.result;
                $scope.action = lng.save;
                for ( i = 0; i < $rootScope.uploads.length; i++ )
                {
                    if ( $rootScope.uploads[i].queue.length > 0 )
                    {
                        $rootScope.uploads[i].iditem = data.result.id;
                        $rootScope.uploads[i].uploadAll();   
                    }
                }
                function saveok()
                {
                    nfy_info( $scope.mode == cnt.M_EDIT ? lng.itemupdated : lng.itemadded );
//                    $scope.formtoview();
//                    $scope.clearuploads();
                    js_formtolist( $scope.mode == cnt.M_EDIT ? $scope.currow : 0 );
                    var mode = $scope.mode == cnt.M_EDIT ? $rootScope.postedit : $rootScope.postnew;
                    if ( mode == cnt.M_NEW )
                        $scope.loaditem();
                    else
                        if ( mode < cnt.M_NEW )                    
                           $scope.setmode( mode );
                        else
                        {
                            $scope.setmode( cnt.M_EDIT );
                            $scope.move( mode == cnt.M_PREV ? -1 : 1 );
                        }
                }
                saveok();
            }
        });
    }    
    $scope.formtoview = function() {
        $scope.view = { id: $scope.form.id };
        var i = $scope.columns.length;
        while ( i-- )
        {
            var icol = $scope.columns[i];
            var alias = icol['alias'];
/*            if ( angular.isDefined( $scope.form[ '__' + alias ] ) && $scope.form[ '__' + alias ] )
            {
                if ( parseInt( icol['idtype'] ) == cnt.FT_LINKTABLE )
                {
                    $scope.view[ alias ]  = '<span class="setitem">' + $scope.form[ '__' + alias] + '</span>';
                }
                else
                    $scope.view[ alias ] = $scope.form[ '__' + alias ]; 
            }
            else
            {*/
                $scope.view[ alias ] = '';
                switch ( parseInt( icol['idtype'] ))
                {
                     case cnt.FT_ENUMSET:
                        var idi = parseInt( $scope.form[alias] );
                        if ( idi > 0 && angular.isDefined( icol['list'][idi] ))
                            $scope.view[ alias ] = icol['list'][idi];
                        break;
                    case cnt.FT_LINKTABLE:
                    case cnt.FT_PARENT:
                        if ( $scope.formlink[ alias ].length > 0 )
                            $scope.view[ alias ]  = '<span class="setitem">' + $scope.formlink[alias] + '</span>';
                        break;
                    case cnt.FT_SETSET:
                        $scope.view[ alias ]  = '<span class="setitem">' + js_getset( $scope.form[alias], alias ).join('</span><span class="setitem">') + '</span>';
                        break;                        
                    case cnt.FT_FILE:
                    case cnt.FT_IMAGE:
                        $scope.view[ alias ] = $scope.form[ alias ];
                        break;
                    case cnt.FT_CHECK:
                        $scope.view[ alias ] = $scope.form[ alias ] == '1' ? lng.yes : lng.no;
                        break;
                    default:
                        $scope.view[ alias ] = $scope.form[ alias ];
                        if ( $scope.view[ alias ] == '0' && icol.number )
                            $scope.view[ alias ] = '';
                        else
                        {
                            $scope.view[alias] = $sce.trustAsHtml( $scope.view[alias] );
                        }
                        break;
                }
//            }
        }
        var iclass = angular.isDefined( cfg.htmleditor ) ? cfg.htmleditor.class : 'redactor';
        $( "."+iclass ).each( function() {
            var attr = $(this).attr('name');
            var value =  $scope.form[ attr ];
            if ( angular.isDefined( cfg.htmleditor ))
                CKEDITOR.instances['id-'+attr].setData( value );
            else
                $(this).redactor('set', value );
        })
    }
    $scope.loaditem = function() {
        if ( $scope.mode != cnt.M_NEW )
            $rootScope.curitem = $scope.items[ $scope.currow - 1 ].id;
        else
        {
            $scope.form = { id: 0, table: $scope.db.id };
            $scope.formlink = {};
            var i = $scope.columns.length;
            while ( i-- )
            {
                var icol = $scope.columns[i];
                $scope.form[ icol.alias ] = icol.number ? 0 : '';
                if ( icol.idtype == cnt.FT_LINKTABLE )
                    $scope.formlink[ icol.alias ] = '';
                if ( icol.idtype == cnt.FT_PARENT )
                    $scope.formlink[ icol.alias ] = '';
            }
            $rootScope.curitem = 0;
            $scope.action = lng.add;            
//            if ( $scope.mode == cnt.M_VIEW )
//                $scope.formtoview();
            return;
        }
        if ( angular.isDefined( $scope.form ) && $rootScope.curitem == $scope.form.id )
            return;
//        $scope.form = $scope.items[ $scope.currow - 1 ];
        DbApi( 'getitem', {id: $rootScope.curitem,
                 table: $routeSegment.$routeParams.id }, function( data ) {
            if ( data.success )
            {
                $scope.form = data.result;
                $scope.action = $scope.form.id != 0 ? lng.save : lng.add;
                $scope.formlink = data.link;
                if ( $scope.mode == cnt.M_VIEW )
                    $scope.formtoview();
            }
        });
    }

    $scope.setmode = function( mode ) { 
        if ( $scope.mode == mode )
            return;
        $scope.mode = mode;
        // For example, if we use CKeditor, ckeditor.js has not been loaded before compiling lisitems.
        if ( $scope.edititems == '' )
            $scope.edititems = $scope.listitems;
        if ( mode )
        {
            $scope.loaditem();
        }
        if ( mode == cnt.M_LIST )
        {
            $("#card").hide();
            $("#list").show();
        }
        else
        {
            $("#list").hide();
            if ( mode != cnt.M_VIEW )
            {
                $("#cardview").hide();
                $("#cardedit").show();
            }
            else
            {
                if ( $scope.mode == cnt.M_VIEW && angular.isDefined( $scope.form ))
                    $scope.formtoview();
                $("#cardedit").hide();
                $("#cardview").show();
            }
            $("#card").show();
        }
    };
    $scope.move = function( shift ) { // -1 or 1
//        $scope.clearuploads();
        if ( shift > 0 )
        {
            if ( $scope.currow < $scope.items.length )
                $scope.currow++;
            else
            {
                if ( $scope.pages.count == 1 )
                    $scope.currow = 1;
                else
                {
                    $scope.params.p = $scope.pages.curpage < $scope.pages.count ? $scope.params.p + 1 : 1;
                    $scope.update();
                }
            }
        }
        else
            if ( $scope.currow > 1 )
                $scope.currow--;
            else
            {
                if ( $scope.pages.count == 1 )
                    $scope.currow = $scope.items.length;
                else
                {
                    $scope.params.p = $scope.pages.curpage > 1 ? $scope.params.p - 1 : $scope.pages.count;
                    $scope.update( true );
                }
            }
        $scope.loaditem();
    }
    $scope.list = function() {
        var list = $("#mainlist");

        list.html('');
        var htmlitem = '<tr><th class="thead" style="width: 50px;"></th><th class="thead" ><input type="checkbox" onchange="js_listallcheck(this)"></th>';
        for ( var k=0; k< $scope.collist.length; k++ )    
        {
            var thclass = '';
            var arrow = '';
            var title = angular.copy( $scope.collist[k].title );

            if ( $scope.collist[k].idtype == cnt.FT_PARENT && angular.isDefined( $scope.params.parent ) )
                title = '';
            if ( $scope.collist[k].id ==  Math.abs( $scope.params.sort )) 
            {
               thclass = ' sorted';
               arrow = '&nbsp;<i class="fa fa-fw '+ ( $scope.params.sort > 0 ? 'fa-long-arrow-down' :
                'fa-long-arrow-up' ) + '"></i>';
            }
            htmlitem += '<th class="thead'+thclass+'"><a href="#" onclick="return js_listsort('+k+', this );">'+ title+'</a>'+arrow+'</th>';
        }
        list.append( htmlitem + '</tr>' );
        htmlitem = '';
        for (var i = 0; i < $scope.items.length; i++ )
            js_listappend( i, list );
    }
    $scope.listedit = function( id ) {
        $scope.currow = id + 1;
        $scope.setmode( cnt.M_EDIT ); 
        return false;  
    }
    $scope.listdel = function( id ) {
        var idi = angular.isArray( id ) ? id : $scope.items[ id ].id;
        var textmsg = 'delitem';
        if ( $scope.db.istree )
            if ( angular.isArray( id ) )
            {
                var length = $scope.items.length;
                while ( --length )
                {
                    if ( parseInt( $scope.items[length]._children ) > 0 && 
                            id.indexOf( $scope.items[length].id ) >= 0 )
                    {
                        textmsg = 'delchildren';
                        break;
                    }
                }
            }
            else
                if ( parseInt( $scope.items[ id ]._children ) > 0 )
                    textmsg = 'delchildren';

        $rootScope.msg_quest( textmsg, function(){ 
            DbApi('dropitem', { id: idi, idtable: $scope.db.id }, function( data ) {
                if ( data.success )
                    if ( $scope.items.length == 1 || angular.isArray( idi ))
                        $scope.update();
                    else
                    {
                        $scope.items.splice( id, 1 );
                        $scope.allcount--;
                        $scope.list();
//                    jQuery("#"+id).remove();
                        nfy_info( lng.itemdel );
                    }
                });
        });   
        return false;
    }
    $scope.update = function( latest ) {
        DbApi( 'table', $scope.params, function( data ) {
            if ( data.success )
            {
    /*            $scope.selectlist = [];
                var i = 0;
                if ( angular.isDefined( $scope.cookies[ data.db.id ] ))
                {
                    var atemp = $scope.cookies[ data.db.id ].split( ',' );
                    i = atemp.length;
                    while ( i-- )
                        $scope.selectlist[ atemp[i]] = true;
                }*/
//                var previd = $scope.currow ? $scope.items[ $scope.currow ].id : 0;
                $scope.db = data.db;
                $scope.allcount = data.pages.found;
                $scope.offset = data.pages.offset;
                $scope.currow = data.result.length ? 1 : 0;
                i = data.result.length;
                while ( i-- )
                {
                    if ( data.result[i].id == $rootScope.curitem )
                        $scope.currow = i + 1;
                    js_list( data.result[i] );
                   // $scope.items[i].name = '<b>' + $scope.items[i].name + '</b>';
                   // $sce.trustAsHtml( $scope.items[i].name );
                }
                $scope.items = data.result;
                $scope.pages = data.pages;
                if ( angular.isDefined($scope.params.parent))
                    $scope.crumbs = data.crumbs;
                if ( angular.isDefined( latest ))
                    $scope.currow = $scope.items.length;
                
                js_page();
                $scope.list();

                if ( $scope.mode > cnt.M_LIST )
                    $scope.loaditem();

    /*            i = $scope.items.length;
                while ( i-- )
                {
                    if ( angular.isDefined(  $scope.selectlist[ $scope.items[i].id ]))
                        $scope.items[i].selected = true;
                    $scope.$watch('items['+i+'].selected', function(){
                        alert( i );//$scope.items[ind].selected  );
                    });
                }*/
            }
        });
    }
    $scope.listdup = function( id ) {
        var idi = $scope.items[ id ].id;
        DbApi( 'dupitem', { id: idi, idtable: $scope.db.id }, function( data ) {
            if ( data.success )
            {
                nfy_info( lng.itemadded );
                $rootScope.curitem = data.success;
                $scope.form = data.result;
//                $scope.formtoview();
                js_formtolist( 0 );
                $scope.setmode( cnt.M_EDIT );
            }
        });
        return false;
    }
/*    $scope.iselect = function( index ){
        $scope.items[index].selected = !$scope.items[index].selected;
        if ( $scope.items[index].selected )
            $scope.selectlist[ $scope.items[index].id ] = true;
        else
            $scope.selectlist.splice( $scope.items[index].id, 1 );
        var i = $scope.selectlist.length;
        alert( angular.toJson(  $scope.selectlist ));
        var out = [];
//        $scope.cookies[ $scope.db.id ].join(',');
//        alert( $scope.cookies[ $scope.db.id ]);
//        alert( $scope.items[index].selected );
        var i = $scope.items.length;
        while ( i-- )
        {
            $scope.items[i].selected = true;
        }
    }*/
    $scope.over = 0;
    $scope.$watch('currow', function(){
        $scope.allcur = parseInt($scope.offset) + parseInt( $scope.currow ); // for EDIT & VIEW
        jQuery(".currow").removeClass('currow');
        var ind = $scope.currow - 1;
        var td = jQuery('#' + ind ).children();
        jQuery(".currow").removeClass('currow');
        td.eq(0).addClass('currow');
        td.eq(1).addClass('currow');
    });
    $scope.columns();
/*    $scope.$watch('allselect', function(){
       var i = $scope.items.length;
       while ( i-- )
          $scope.items[i].selected = $scope.allselect;
    });*/
}

/*geapp.module('compile', [], function($compileProvider) {
    // configure new 'compile' directive by passing a directive
    // factory function. The factory function injects the '$compile'
    $compileProvider.directive('compile', function($compile) {
      // directive factory creates a link function
      return function(scope, element, attrs) {
        scope.$watch(
          function(scope) {
             // watch the 'compile' expression for changes
            return scope.$eval(attrs.compile);
          },
          function(value) {
            // when the 'compile' expression changes
            // assign it into the current DOM
            element.html(value);
 
            // compile the new DOM and link it to the current
            // scope.
            // NOTE: we only compile .childNodes so that
            // we don't get into infinite loop compiling ourselves
            $compile(element.contents())(scope);
          }
        );
      };
    })
 });*/
 
/*
function EdititemCtrl($scope, $routeSegment, DbApi, $rootScope ) {
    $scope.$routeSegment = $routeSegment;
    DbApi[ 'edititem' ]( $routeSegment.$routeParams, function( data ) {
        if ( data.success )
        {
            $scope.db = data.db;
            $scope.columns = data.columns;
            $scope.listitems = data.listitems;
            $scope.form = data.result;
            if ( $scope.form.id != 0 )
            {
                $scope.action = lng.save;
            }
            else
                $scope.action = lng.add;
        }
    });
    $rootScope.cheditform = function( obj, callback ) {
        for(var k in obj)
        {
            $scope.form[k] = obj[k];
            break;
        }
        callback();
    }
    $scope.saveitem = function(){
//        alert( angular.toJson( $scope.form ));
       DbApi[ 'saveitem' ]( $scope.form, function( data ) {
            if ( data.success )
            {
                document.location = '#/edititem?table='+$scope.form.table+'&id=' + data.success;
            }
        });
    }
}
*/
function MenuCtrl($scope, $routeSegment, DbApi, $rootScope ) {
    $scope.$routeSegment = $routeSegment;
    $scope.savemenu = function() {
        $rootScope.savemenu();
    }
    $scope.editfolder = function( index, isitem ) {
        var add = angular.isUndefined( index );
        var it = angular.isDefined( isitem );
        function foldermsg() {
            if ( it )
                title = add ? lng.newitem : lng.edititem;
            else
                title = add ? lng.newfld : lng.editfld;
           $rootScope.msg( { title: title, template: tpl( it ? 'dlgmenu.html' : 'dlgfolder.html' ),
                   btns: [ {text: add ? lng.add : lng.save, func: $scope.savemenu, class: 'btn-primary btn-near' },
                           {text: lng.cancel, class: 'btn-default btn-near' }
               ]  })
        }
        if ( add )
        {
            DbApi( 'gettree', { dbname: 'menu' }, function( data ) {
                if ( data.success )
                {
                    $rootScope.tablefld = data.result;
                    $rootScope.form = {title: '', idparent: 0, id: 0, isfolder: it ? 0 : 1 };
                    if ( it )
                        angular.extend( $rootScope.form, { url:'', hint:'' } );
                    foldermsg();
                }
            })
        }
        else
        {
            obj = $rootScope.indmenu[index];
            $rootScope.form = {title: obj.title, idparent: obj.idparent, id: obj.id, 
                               index: index, isfolder: obj.isfolder };
            if ( it )
                angular.extend( $rootScope.form, { url: obj.url, hint: obj.hint } );    
            foldermsg();
        }
    }
    $scope.editmenu = function( index ) {
        $scope.editfolder( index, true );
    }
    $scope.edit = function( index ) {
        var i = $rootScope.indmenu.length;
        while ( i-- )
        {
            if (  $rootScope.indmenu[i].id == index )
            {
                obj = $rootScope.indmenu[i];
                break;
            }
        }
        if ( obj.isfolder != 0 )
            $scope.editfolder( i );
        else
            $scope.editmenu( i );
    }
    $scope.delmenu = function( id ) {
        $rootScope.msg_quest( 'delitem', function(){ 
            DbApi( 'delmenu', { id: id }, function( data ) {
                if ( data.success )
                {
                    $rootScope.indmenu = data.result;
                    $rootScope.loadmenu(); 
                }
             })
        })
    }
    $scope.sortfield = function( val ) {
        jQuery( "#fields" ).sortable( { disabled: val } );
    }
    $scope.sortok = function( id ) {
        $scope.moveid = id;
        var i = $rootScope.indmenu.length;
        while ( i-- ) {
            if ( $rootScope.indmenu[i].id == id && $rootScope.indmenu[i].isfolder &&
                 $rootScope.indmenu[i].expand )
            {
                $rootScope.indmenu[i].expand = false;
                break;
            }
        }
        $scope.sortfield( false );
    }
    jQuery( "#fields" ).sortable( { axis: "y", helper: function( event, ui ){ 
         return $('<div class="striphelper">&nbsp;</div>'); },
            forceHelperSize: true,
            disabled: true,
//            forcePlaceholderSize: true,
//            placeholder: "placeholder",
            cursor: "move",
            update: function( event, ui ) { 
                var prev = 0, next = 0, found = 0;
                $("#fields .imenulist:visible").each(function(index) {
                    var item = $(this);
                    var ind = parseInt( item.attr("ind"));
                    if ( found )
                    {
                        next = ind;
                        return false;
                    }
                    if ( ind == $scope.moveid )
                        found = ind;
                    else
                        prev = ind;
                });
                 DbApi( 'movemenu', { prev: prev, id: $scope.moveid, next: next }, function( data ) {
                    if ( data.success )
                    {
                        $rootScope.indmenu = data.result;
                        $rootScope.loadmenu();
                    }
                })
            },
            stop: function( event, ui ) { 
                $scope.sortfield( true );
            },
            /*cancel: ".nosort"*/
            items: "div.imenulist" } );
}

function AppsettingsCtrl($scope, $rootScope, $routeSegment, DbApi ) {
    DbApi( 'getdb', {}, function( data ) {
        $scope.items = data.result;
    });
    $scope.changeswitch = function( value, callback )
    {
        DbApi( 'savedb', value, function( data ) {
            $rootScope.updatesettings( 0, value );
            callback();
         });
    }

/*    $scope.langlist = langlist;
    $scope.form = { title: cfg.title, apitoken: cfg.apitoken, isalias: cfg.isalias };  
    $scope.changealias = function( value, callback )
    {
         DbApi[ 'savedb' ]( { isalias: value }, function( data ) {
            $scope.form.isalias = value;
            cfg.isalias = value;
            callback();
         });
    }
    $scope.language = function()
    {
        DbApi[ 'savedb' ]( { lang: $scope.form.dblang }, function( data ) {});
    }*/
    $scope.$routeSegment = $routeSegment;
}    

function EdittableCtrl( $rootScope, $scope, $routeSegment, DbApi ) {
    $scope.$routeSegment = $routeSegment;
    $scope.isalias = cfg.isalias;
  
    $scope.form = {};
    if ( angular.isDefined( $routeSegment.$routeParams.id ))
    {
        $scope.action = lng.save;
        $scope.title = lng.edittbl;
        $scope.id = $routeSegment.$routeParams.id;
    }
    else
    {
        $scope.action = lng.create;
        $scope.title = lng.newtbl;
        $scope.id = 0;
    }
    $scope.items = [];
    $scope.submit = function() {

        if ( !$scope.items.length )
            return $rootScope.msg_warning( 'war_efield' );
        if ( $scope.form.title == '' )
            return $rootScope.msg_warning( 'war_ename' );
        if ( $scope.id == 0 )
        {
            $scope.parent = angular.isDefined( $routeSegment.$routeParams.idparent ) ? 
                             $routeSegment.$routeParams.idparent : 0;
            $scope.form.idparent = $scope.parent;
        }
        DbApi( 'savestruct', { id: $scope.id, form: $scope.form, items: $scope.items }, function( data ) {
            if ( data.success )
                document.location = '#/?id=' + data.result.idparent;
        });
    }
    $scope.removefield = function( ind ) {
        $rootScope.msg_quest('delfield', function(){ $scope.items.splice( ind, 1 ) });
    }
    $scope.savefield = function() {

        types[  $rootScope.form.idtype ].verify( $rootScope.form );
        if ( $scope.index < 0 )
            $scope.items.push( angular.copy( $rootScope.form ));
        else
            $scope.items[$scope.index] = $rootScope.form;
    }
    $rootScope.chvisible = function( newval, callback ) {
        $rootScope.form.visible = newval;
        callback();
    }
    $rootScope.istree = function( newval, callback ) {
        $scope.form.istree = newval;
        callback();
    }
    $rootScope.setcheck = function( newval, callback ) {
        for ( tkey in newval )
        {
            $rootScope.form.extend[ tkey ] = newval[tkey];
        }
        callback();
    }
    $rootScope.getcols = function() {
        DbApi( 'getstruct', { id: $rootScope.form.extend.table }, function( data ) {
                $rootScope.linkcols = data.result.items;
            });
    }
    $scope.editfield = function( index ) {
        
        var add = angular.isUndefined( index );

        $rootScope.isalias = cfg.isalias;
        if ( add )
        {
            $rootScope.form = {title: '', comment: '', visible: 1, id: 0, idtype: 1, 
                         alias: '', align: 0 };
            $scope.index  = -1;
        }
        else
        {
            $rootScope.form = angular.copy( $scope.items[index] );
            $scope.index  = index;
        }
        if ( angular.isUndefined( $rootScope.form.extend ))
            $rootScope.form.extend = {};
        var extend = $rootScope.form.extend;
        for ( tkey in types )
        {
            for ( var it = 0; it < types[tkey].extend.length; it++ )
            {
                var par = types[tkey].extend[it];
                if ( angular.isUndefined( extend[ par.name ] ))
                    extend[ par.name ] = par.def;
                 if ( angular.isUndefined( par.title ))
                    par.title = lng[par.name];
            }
        }
        $rootScope.getcols();
        $rootScope.msg( { title: add ? lng.newitem : lng.edititem, template: tpl('dlgfield.html'),
              btns: [ {text: add ? lng.add : lng.save, func: $scope.savefield, class: 'btn-primary btn-near' },
                     {text: lng.cancel, class: 'btn-default btn-near' }
        ]  } );

//        if ( add )
    }
    $scope.sortfield = function( val ) {
        jQuery( "#fields" ).sortable( { disabled: val } );
    }
    jQuery( "#fields" ).sortable( { axis: "y", helper: function( event, ui ){ 
         return $('<tr class="helper"><td colspan="3"></td></tr>'); },
            forceHelperSize: true,
            disabled: true,
//            forcePlaceholderSize: true,
//            placeholder: "placeholder",
            cursor: "move",
            update: function( event, ui ) { 
                var flength = $scope.items.length;
                $("#fields").children().each(function(index) {
                    var item = $(this);
                    if ( angular.isUndefined( item.attr("ord")) )
                        return true;
                    var old = parseInt( item.attr("ord"));
                    $scope.items.push($scope.items[ old ]);
                });
                $scope.items.splice( 0, flength );
                $scope.$apply();
            },
            stop: function( event, ui ) { 
                $scope.sortfield( true );
            },
            /*cancel: ".nosort"*/
            items: "tr:not(.nosort)" } );

    DbApi( 'getstruct', { id: $scope.id }, function( data ) {
        $scope.items = data.result.items;
        $scope.form = data.result.form;
    });
    DbApi( 'gettables', { parent: -1 }, function( data ) {
        $rootScope.tables = data.result;
    });
    DbApi( 'getsets', {}, function( data ) {
        $rootScope.sets = data.result;
    });

//    alert( $stateParams.idi );
}

function ImportCtrl($scope, $routeSegment, DbApi ) {
    $scope.$routeSegment = $routeSegment;
    $scope.form = { importdata: 1 };
    $scope.importdata = function( newval, callback ) {
        $scope.form.importdata = newval;
        callback();
    }
    $scope.submit = function() {
       DbApi( 'import', $scope.form, function( data ) {
            if ( data.success )
            {
                document.location = '#/edittable?id='+ data.success;
            }
        }); 
    }
/*    DbApi[ 'edititem' ]( $routeSegment.$routeParams, function( data ) {
        if ( data.success )
        {
            $scope.db = data.db;
            $scope.columns = data.columns;
            $scope.listitems = data.listitems;
            $scope.form = data.result;
            if ( $scope.form.id != 0 )
            {
                $scope.action = lng.save;
            }
            else
                $scope.action = lng.add;
        }
    });
    $scope.saveitem = function(){
       DbApi[ 'saveitem' ]( $scope.form, function( data ) {
            if ( data.success )
            {
                document.location = '#/edititem?table='+$scope.form.table+'&id=' + data.success;
            }
        }); 
    }*/
}

function SetsCtrl($scope, $rootScope, $routeSegment, DbApi ) {
    $scope.$routeSegment = $routeSegment;
    $scope.dropset = function( index ) {
        cfg.temp = $scope.items[ index].title;
        $rootScope.msg_quest( 'delset', function(){ 
            DbApi( 'dropset', { id: $scope.items[index].id }, function( data ) {
                $scope.items.splice( index, 1 ) });
            });
        return false;
    }
    $scope.saveset = function() {
        if ( $rootScope.form.title == '' )
        {
            $rootScope.msg_warning('war_ename');
            return false;
        }
        DbApi( 'saveset', $scope.form, function( data ) {
            if ( data.success )
                if ( $rootScope.form.id )
                    $scope.items[$rootScope.form.index].title = data.result.title;
                else
                {
                    DbApi( 'getsets', {}, function( data ) {
                        $scope.items = data.result;
                    });
                }
        });
        //alert($rootScope.form.cur);
    }
    $scope.editset = function( index ) {
        var add = angular.isUndefined( index );
        function setmsg() {
           $rootScope.msg( { title: add ? lng.create : lng.edit, template: tpl('dlgset.html'),
                   btns: [ {text: add ? lng.add : lng.save, func: $scope.saveset, class: 'btn-primary btn-near' },
                           {text: lng.cancel, class: 'btn-default btn-near' }
               ]  })
        }
        if ( add )
        {
            $rootScope.form = {title: '', id: 0 };
            setmsg();
        }
        else
        {
            obj = $scope.items[index];
            $rootScope.form = {title: obj.title, id: obj.id, index: index };
            setmsg();
        }
    }
    DbApi( 'getsets', {}, function( data ) {
        $scope.items = data.result;
    });
}

function SetCtrl($scope, $routeSegment, DbApi, $rootScope, $sce ) {
    $scope.$routeSegment = $routeSegment;
    $scope.idset = $scope.$routeSegment.$routeParams.id;
    DbApi( 'set', $routeSegment.$routeParams, function( data ) {
        if ( data.success )
        {
            $scope.title = data.title;
            $scope.items = data.result;
        }
    });
    $scope.savesetitem = function() {
        if ( $rootScope.form.title == '' )
        {
            $rootScope.msg_warning('war_ename');
            return false;
        }
        DbApi( 'savesetitem', $scope.form, function( data ) {
            if ( data.success )
            {
                if ( $rootScope.form.id !=0 )
                    $scope.items[ $rootScope.form.index ].title = $rootScope.form.title;
                else
                {
                    DbApi( 'set', $routeSegment.$routeParams, function( data ) {
                        $scope.items = data.result;
                    });
                }
            }
        });
    }
    $scope.newi = function( index ) {
        var add = angular.isUndefined( index );
        function setmsg() {
           $rootScope.msg( { title: add ? lng.create : lng.edit, template: tpl('dlgset.html'),
                   btns: [ {text: add ? lng.add : lng.save, func: $scope.savesetitem, class: 'btn-primary btn-near' },
                           {text: lng.cancel, class: 'btn-default btn-near' }
               ]  })
        }
        if ( add )
        {
            $rootScope.form = {title: '', id: 0, idset: $scope.idset };
            setmsg();
        }
        else
        {
            obj = $scope.items[index];
            $rootScope.form = {title: obj.title, id: obj.id, index: index, idset: $scope.idset };
            setmsg();
        }
    }
    $scope.delete = function( ) {
        if ( $scope.ind > 0 )
        {
            var lastid = $scope.ind - 1;
            var id = $scope.items[ lastid ].id;
            $rootScope.msg_quest( 'delitem', function(){ 
                DbApi( 'dropsetitem', { id: id, idset: $scope.idset }, function( data ) {
                    if ( data.success )
                        $scope.items.splice( lastid, 1 );
                    });
            });   
        }
    }
    $scope.editi = function( ){
        if ( $scope.ind > 0 )
           $scope.newi( $scope.ind - 1 );
    }
    $scope.over = 0;
    $scope.mouseenter = function( index ){
        if ( $scope.over )
        {
            $scope.mouseleave();
        }
        $scope.over = jQuery('#'+index);
//        alert( angular.toJson( $scope.over ));
        $scope.over.children().addClass('over');
        $scope.overdiv = $scope.over.children().first().children();
        $scope.overdiv.first().show();
        $scope.overdiv.eq(1).hide();
        $scope.ind = index + 1;
    }
    $scope.mouseleave = function(){
        $scope.over.children().removeClass('over');
        $scope.overdiv.first().hide();
        $scope.overdiv.eq(1).show();
        $scope.overdiv = 0;
        $scope.over = 0;
        $scope.ind = 0;
    }
}
