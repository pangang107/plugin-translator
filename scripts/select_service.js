(function(window, undefined){
    window.Asc.plugin.init = function()
    {
        this.resizeWindow(400, 130, 400, 130, 400, 130);
    };
    window.Asc.plugin.button = function(id)
    {
        if (0 == id) {
            localStorage.setItem($('#translate-services').attr('data-id'), document.getElementById("translate-services").value);
        }
        this.executeCommand("close", "");
    };
    window.Asc.plugin.onThemeChanged = function(theme)
    {
        window.Asc.plugin.onThemeChangedBase(theme);
    };
    $(document).ready(function () {
        $('.select_example').select2({
			minimumResultsForSearch: Infinity,
			width: "100%"
		});


    });
})(window, undefined);
