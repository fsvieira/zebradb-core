riot.tag2('app', '<div class="mdl-layout mdl-js-layout mdl-layout--fixed-header"> <header class="mdl-layout__header"> <div class="mdl-layout__header-row"> <span class="mdl-layout-title" onclick="{start}">{opts.title}</span> <div class="mdl-layout-spacer"></div> <button id="main-menu" class="mdl-button mdl-js-button mdl-button--icon"> <i class="material-icons">more_vert</i> </button> <ul class="mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect" for="main-menu"> <li class="mdl-menu__item"><a href="#datainput">Data Input</a></li> </ul> </div> </header> <div class="mdl-layout__drawer"> <span class="mdl-layout-title">{opts.title}</span> <nav class="mdl-navigation"> <a class="mdl-navigation__link" href="#datainput">Set Data</a> </nav> </div> <main class="mdl-layout__content {background}" name="content"></main> </div>', '', '', function(opts) {
      var tag = this;

      this.backgrounds = [
        "bg-raindrops-1",
        "bg-raindrops-2"
      ];

      this.background = "";

      this.on('mount', function () {
          componentHandler.upgradeDom();

          riot.route((collection) => {

              riot.mount(this.content, collection, tag.opts)
          });

          riot.route.start(true);
          riot.route("datainput");
      });
});