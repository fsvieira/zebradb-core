riot.tag2('datashow', '<div each="{branchs, i in opts.data.levels}" class="card"> <div each="{branchs}" class="card-item"> {query} </div> </div>', '', '', function(opts) {
        this.data = JSON.stringify(opts.data, null, '\t');
});