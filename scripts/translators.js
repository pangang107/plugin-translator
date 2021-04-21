(function(window, undefined){
	var oScrollApertiumDeepL;
    var sTranslateServiceType = '';
    var txt                   = "";
    var arrTranslatedText        = [];
    var displayNoneClass      = "display-none";
    var elements              = null;

    // for apertium
    var iterationCount     = 0;
    var curIter            = 0;
    var select             = null;
    var selectClone        = null;
    var allPairs           = {};
    var apertiumServiceUrl = "https://www.apertium.org/"; //paste your service's url address here

    // for deepl
    var apikey  = '';
    var ifr;

    // for google
    var isInit = false;
	const isIE = checkInternetExplorer();	//check IE
	var message = "This plugin doesn't work in Internet Explorer."

    function updateScroll()
	{
		Ps && Ps.update();
	};

    // for deepl/apertium
    function showLoader(elements, show) {
       switchClass(elements.loader, displayNoneClass, !show);
    };
    function showLoader2(elements, show) {
       switchClass(elements.loader2, displayNoneClass, !show);
    };
	function switchClass(el, className, add) {
        if (add) {
            el.classList.add(className);
        } else {
            el.classList.remove(className);
        }
    };
    function DelInvalidChars(arrParas) {
        for (var nPara = 0; nPara < arrParas.length; nPara++) {
            arrParas[nPara] = arrParas[nPara].replace(/#/gi, '');
            arrParas[nPara] = arrParas[nPara].replace(/&/gi, '');
        }
    };
    function SplitText(sText) {
        var allParasInSelection = sText.split(/\n/);
        var allParsedParas = [];

        for (var nStr = 0; nStr < allParasInSelection.length; nStr++) {
            if (allParasInSelection[nStr].search(/	/) === 0) {
                allParsedParas.push("");
                allParasInSelection[nStr] = allParasInSelection[nStr].replace(/	/, "");
            }
            var sSplited = allParasInSelection[nStr].split(/	/);

            sSplited.forEach(function(item, i, sSplited) {
                allParsedParas.push(removeCR(item));
            });
        }

        return allParsedParas;
    };
    function removeCR(text) {
        return text.replace(/\r\n?/g, '');
    };
    function selectText(id) {
        var sel, range;
        var el = document.getElementById(id); //get element id
        if (window.getSelection && document.createRange) { //Browser compatibility
        sel = window.getSelection();
        if (sel.toString() == '') { //no text selection
            window.setTimeout(function(){
                range = document.createRange(); //range object
                range.selectNodeContents(el); //sets Range
                sel.removeAllRanges(); //remove all ranges from selection
                sel.addRange(range);//add Range to a Selection.
                document.execCommand("copy"); //copy
                sel.removeAllRanges(); //remove all ranges from selection
            },1);
        }
        } else if (document.selection) { //older ie
            sel = document.selection.createRange();
            if (sel.text == '') { //no text selection
                range = document.body.createTextRange();//Creates TextRange object
                range.moveToElementText(el);//sets Range
                range.select(); //make selection.
                document.execCommand("copy"); //copy
            }
        }
    };
    function RunTranslate(sText) {
        // for apertium
        var source_lang    = null;
        var txtToTranslate = '';
        // for deepl
        var sParams = null;

        // common
        arrTranslatedText   = [];
        var target_lang     = '';
        var allParsedParas = SplitText(sText);
        DelInvalidChars(allParsedParas);
        if (IsLastTransate(allParsedParas))
            return false;

        switch (sTranslateServiceType) {
            case 'apertium': {
                target_lang = GetTargetLang('apertium');
                curIter = 0;
                source_lang = GetSourceLang();
                txtToTranslate = PrepareTextToSend(allParsedParas);
                iterationCount = 0;
                for (var nText = 0; nText < txtToTranslate.length; nText++) {
                    if (txtToTranslate[nText].Text === "")
                        continue;
                    iterationCount++;
                }
                for (var nText = 0; nText < txtToTranslate.length; nText++) {
                    if (txtToTranslate[nText].Text === "") {
                        arrTranslatedText[nText] = "";
                        continue;
                    }
                    TranslateApertium(source_lang, target_lang, txtToTranslate[nText]);
                }
                break;
            }

            case 'deepl':
                target_lang = GetTargetLang('deepl');
                sParams = CreateParams(allParsedParas);
                TranslateDeepL(apikey, target_lang, sParams);
                break;
        }
    };

    //////////// apertium ///////////
    function PrepareTextToSend(allParas) {
        var result = [];
        var preparedTxt = ""
        for (var nPara = 0; nPara < allParas.length; nPara++) {
            result.push({Index : nPara, Text : allParas[nPara].replace(/ /gi, "+")});
        }
        return result;
    };
    function IsLastTransate(arrParas) {
        if (arrParas.length !== arrTranslatedText.length)
            return false;
        for (var nPara = 0; nPara < arrParas.length; nPara++) {
            if (arrParas[nPara] !== arrTranslatedText[nPara])
                return false;
        }
        return true;
    };
    function GetSourceLang() {
        return document.getElementById("apertium-source").value;
    };
    function GetTargetLang(sTranslateServiceType) {
        return document.getElementById(sTranslateServiceType + "-target").value;
    };
    //don't work with default apertium demo service
    function IdentifyLang() {
        $.ajax({
            method: 'GET',
            url: apertiumServiceUrl + 'apy/listPairs',
            dataType: 'json'
        }).success(function (oResponse) {
            var maxPredicVal = 0;
            var maxPredict = null;

            for (var predict in oResponse) {
                if (oResponse[predict] > maxPredicVal) {
                    maxPredicVal = oResponse[predict];
                    maxPredict = predict;
                }
            }
        }).error(function(){

        });
    };
    function GetAllLangPairs() {
        showLoader2(elements, true);
        $.ajax({
            method: 'GET',
            url: apertiumServiceUrl + 'apy/list?',
            dataType: 'json'
        }).success(function (oResponse) {
            var sourceLang = oResponse.responseData[0].sourceLanguage;
            var targetLang = oResponse.responseData[0].targetLanguage;

            allPairs[sourceLang] = [targetLang];

            for (var nPair = 1; nPair < oResponse.responseData.length; nPair++) {
                if (oResponse.responseData[nPair].sourceLanguage === sourceLang) {
                    allPairs[sourceLang].push(oResponse.responseData[nPair].targetLanguage);
                }
                else {
                    sourceLang = oResponse.responseData[nPair].sourceLanguage;
                    targetLang = oResponse.responseData[nPair].targetLanguage;
                    allPairs[sourceLang] = [targetLang];
                }
            }

            AddLangOptions(allPairs);
        }).error(function(){
            showLoader2(elements, false);
        });
    };
    function AddLangOptions(allPairs) {
        var sUrlRequest = 'listLanguageNames?locale=en&languages='
        for (var sLang in allPairs) {
            sUrlRequest += sLang + '+';
        }
        $.ajax({
            method: 'GET',
            url: apertiumServiceUrl + 'apy/' + sUrlRequest,
            dataType: 'json'
        }).success(function (oResponse) {
            var sourceLang = GetSourceLang();

            for (var sLang in oResponse) {
                $("#apertium-source").append($("<option>", {
                    value: sLang,
                    text: oResponse[sLang],
                    class: "source"
                    }));
                $("#apertium-target").append($("<option>", {
                    value: sLang,
                    text: oResponse[sLang],
                    class: "target"
                    }
                ));
            }
            $("#apertium-source option[value=eng]").prop('selected', true);
            select = $('#apertium-target');
            selectClone = select.clone();
            updateSelect(allPairs["eng"]);
            showLoader2(elements, false);

            RunTranslate(txt);

            $('#apertium-target').on('change', function() {
                arrTranslatedText = [];
                RunTranslate(txt);
            });
        }).error(function(){
            showLoader2(elements, false);
        });
    };
    function updateSelect(arrTargetLangs) {
        // first, remove all options
        select.find("option").remove();

        var options = [];

        for (var nLang = 0; nLang < arrTargetLangs.length; nLang++) {
            options.push(selectClone.find("option[value=" + arrTargetLangs[nLang] + "]").clone()[0]);
        }

        select.append(options);

        // update select2
        select.trigger('change');
    }
    function isReadyToTranslate() {
        if ($('#apertium-source').val() == null)
            return false;
        return true;
    };
    function TranslateApertium(sourceLanguage, targetLanguage, oText) {
        showLoader(elements, true);
        $.ajax({
            method: 'GET',
            url: apertiumServiceUrl + 'apy/translate?markUnknown=no&langpair=' + sourceLanguage + '|' + targetLanguage + '&q=' + oText.Text,
            dataType: 'json'
        }).success(function (oResponse) {
            arrTranslatedText[oText.Index] = oResponse.responseData.translatedText;

            curIter++;
            if (curIter === iterationCount) {
                container = document.getElementById('txt_shower');
                container.innerHTML = "";
                for (var nText = 0; nText < arrTranslatedText.length; nText++) {
                    if (arrTranslatedText[nText] !== "" && arrTranslatedText[nText])
                        container.innerHTML += arrTranslatedText[nText] + '<br>';
                }
                if ($('#vanish_container').hasClass('display-none'))
                    $('#vanish_container').toggleClass('display-none');
                updateScroll();
                updateScroll();
                showLoader(elements, false);
            }
        }).error(function() {
            showLoader(elements, false);
            container = document.getElementById('txt_shower');
            container.innerHTML = "Failed!"
        });
    };

    // for deepl
    function TranslateDeepL(apikey, targetLanguage, sParams) {
        showLoader(elements, true);
        $.ajax({
            method: 'POST',
            beforeSend: function(request) {
				request.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded');
			},
			data: '?auth_key=' + apikey + sParams  + '&target_lang=' + targetLanguage,
            url: 'https://api.deepl.com/v2/translate?auth_key=' + apikey

        }).success(function (oResponse) {
            isValidKey = true;
            if ($('#txt_shower').hasClass('error'))
                $('#txt_shower').toggleClass('error');

            if ($('#api-value').hasClass('img_error'))
                $('#api-value').toggleClass('img_error');
            if (!$('#api-value').hasClass('error_api'))
                $('#api-value').toggleClass('error_api');

            localStorage.setItem('deepL_Apikey', apikey);

            //switching menu
            switchClass(elements.api_panel, 'display-none', true);
            switchClass(elements.re_api, 'display-none', false);
            $('#language-panel').show();
            $('#common-elements').show();

            container = document.getElementById('txt_shower');
            container.innerHTML = "";
            for (var nText = 0; nText < oResponse.translations.length; nText++) {
                translatedText.push(oResponse.translations[nText].text);

                if (oResponse.translations[nText].text !== "")
                    container.innerHTML += oResponse.translations[nText].text + '<br>';
            }

            if ($('#vanish_container').hasClass('display-none'))
                $('#vanish_container').toggleClass('display-none');

            updateScroll();
            updateScroll();

            showLoader(elements, false);

        }).error(function(oResponse) {
            isValidKey = false;
            showLoader(elements, false);
            container = document.getElementById('txt_shower');
            if (!$('#txt_shower').hasClass('error'))
                $('#txt_shower').toggleClass('error');

            if (apikey == '') {
                container.innerHTML = "API key required!";
            }
            else {
                if (oResponse.status === 403) {
                    if (!$('#api-value').hasClass('img_error'))
                        $('#api-value').toggleClass('img_error');
                    container.innerHTML = "API key is not valid!"
                }
                else
                    container.innerHTML = "Connection failed!";
            }
        });
    };
    function CreateParams(allParas) {
        var sRequest = "";

        for (var nPara = 0; nPara < allParas.length; nPara++) {
            sRequest += '&text=' + allParas[nPara];
        }

        return sRequest;
    };

    // for google
    function checkInternetExplorer(){
		var rv = -1;
		if (window.navigator.appName == 'Microsoft Internet Explorer') {
			const ua = window.navigator.userAgent;
			const re = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})');
			if (re.exec(ua) != null) {
				rv = parseFloat(RegExp.$1);
			}
		} else if (window.navigator.appName == 'Netscape') {
			const ua = window.navigator.userAgent;
			const re = new RegExp('Trident/.*rv:([0-9]{1,}[\.0-9]{0,})');

			if (re.exec(ua) != null) {
				rv = parseFloat(RegExp.$1);
			}
		}
		return rv !== -1;
	};
	function ProcessText(sText) {
        return sText.replace(/	/gi, '\n').replace(/	/gi, '\n');
    };
    function ProcessGoogle(sText) {
        if (isIE) {
			document.getElementById("ifr-google-container").innerHTML = "<h4 id='h4' style='margin:5px'>" + message + "</h4>";
			return;
		}

	  	sText = ProcessText(sText);

		if (!isInit) {
		    ifr    = document.createElement("iframe");;
			document.getElementById("ifr-google-container").innerHTML = "";
			ifr                = document.createElement("iframe");
			ifr.position	   = "fixed";
			ifr.name           = "google_name";
			ifr.id             = "google_id";
			ifr.src            = "./index_widget.html";//?text=" + encodeURIComponent(text);
			ifr.style.top      = "0px";
			ifr.style.left     = "0px";
			ifr.style.width    = "100%";
			ifr.style.height   = "100%";
			ifr.setAttribute("frameBorder", "0");
			document.getElementById("ifr-google-container").appendChild(ifr);
			isInit = true;
			ifr.onload = function() {
				if (ifr.contentWindow.document.readyState == 'complete')
					setTimeout(function() {
						ifr.contentDocument.getElementById("google_translate_element").innerHTML = sText;
						if (sText.length)
							ifr.contentDocument.getElementById("div_btn").classList.remove("hidden");
					}, 500);

				var selectElement = ifr.contentDocument.getElementsByClassName('goog-te-combo')[0];
				selectElement.addEventListener('change', function(event) {
					ifr.contentWindow.postMessage("onchange_goog-te-combo", '*');
					ifr.contentDocument.getElementById("google_translate_element").style.opacity = 0;
				});
				ifr.contentDocument.getElementById("google_translate_element").style.height = "fit-content";
                ifr.contentDocument.getElementById("body").style.cssText += 'display: flex; flex-direction: column;'

				var btn = ifr.contentDocument.createElement("button");
				var btnReplace = ifr.contentDocument.createElement("button");
				var div = ifr.contentDocument.createElement("div");
				div.style.cssText = 'margin-bottom: 25px;'
				div.appendChild(btn);
				div.appendChild(btnReplace);
				div.id = "div_btn";
				div.classList.add("skiptranslate");
				div.classList.add("div_btn");
				div.classList.add("hidden");
				btn.innerHTML = window.Asc.plugin.tr("Copy");
				btn.id = "btn_copy";
				btn.classList.add("btn-text-default");
				btnReplace.classList.add("btn-text-default");
				btnReplace.innerHTML = window.Asc.plugin.tr("Replace");
				btnReplace.id = "btn_replace";
				setTimeout(function() {ifr.contentDocument.getElementById("body").appendChild(div);}, 100);

				setTimeout(function() {
                    btnReplace.onclick = function () {
                        var translatedTxt = ifr.contentDocument.getElementById("google_translate_element").outerText;
                        var allParasTxt = translatedTxt.split(/\n/);
                        var allParsedParas = [];

                        for (var nStr = 0; nStr < allParasTxt.length; nStr++) {
                            if (allParasTxt[nStr].search(/	/) === 0) {
                                allParsedParas.push("");
                                allParasTxt[nStr] = allParasTxt[nStr].replace(/	/, "");
                            }
                            var sSplited = allParasTxt[nStr].split(/	/);

                            sSplited.forEach(function(item, i, sSplited) {
                                allParsedParas.push(item);
                            });
                        }
                        Asc.scope.arr = allParsedParas;
                        window.Asc.plugin.callCommand(function() {
                            Api.ReplaceTextSmart(Asc.scope.arr);
                        });
                    }
                });
				ifr.contentWindow.postMessage("update_scroll", '*');
			}
		} else {
			ifr.contentWindow.postMessage(sText, '*');
			ifr.contentDocument.getElementById("google_translate_element").style.opacity = 0;
		}
		var style = document.getElementsByTagName('head')[0].lastChild;
		var theme = window.Asc.plugin.theme;
		setTimeout(()=>ifr.contentWindow.postMessage({theme,style : style.innerHTML + '#change-service-btn { border-color : ' + window.Asc.plugin.theme.Color + '!important;\n}'}, '*'),600);
    };

	window.Asc.plugin.init = function(text)
	{
	    txt = text;
        if (sTranslateServiceType === 'deepl' || sTranslateServiceType === 'apertium') {
            document.getElementById("textarea").value = text;
            txt = document.getElementById("textarea").value;

            switch (window.Asc.plugin.info.editorType) {
                case 'word':
                case 'slide': {
                    if (text !== "") {
                        RunTranslate(txt);
                    }
                    break;
                }
                case 'cell': {
                    RunTranslate(txt);
                }
                break;
            }
        }
        else if (sTranslateServiceType === 'google') {
            ProcessGoogle(txt);
        }
	};

    $(document).ready(function () {
         sTranslateServiceType = localStorage.getItem("translator-service-id") || 'google';

        elements = {
            api_panel: document.getElementById("api-panel"),
            re_api: document.getElementById("re-api"),
            api_value: document.getElementById("api-value"),
            loader: document.getElementById("loader-container"),
            loader2: document.getElementById("loader-container2"),
            contentHolder: document.getElementById("display"),
            contentHolder2: document.getElementById("main_panel"),
            deepl_panel : document.getElementById("deepl-panel"),
            apertium_panel : document.getElementById("apertium-panel"),
            ifr_google : document.getElementById("ifr-google-container")
		};

		    switch (sTranslateServiceType) {
		        case 'deepl':
		            $('#deepl-apertium-container').show();
		            switchClass(elements.deepl_panel, 'display-none', false);
		            apikey = localStorage.getItem('deepL_Apikey');
                    if (apikey !== null) {
                        switchClass(elements.api_panel, 'display-none', true);
                        switchClass(elements.re_api, 'display-none', false);
                        $('#language-panel').show();
                        $('#common-elements').show();
                    }
                    else
                        apikey = '';
		            break;
		        case 'apertium': {
		            $('#apertium-source').on('change', function() {
                        updateSelect(allPairs[GetSourceLang()]);
                    });
                    $('#deepl-apertium-container').show();
                    $('#common-elements').show();
		            switchClass(elements.apertium_panel, 'display-none', false);
		            GetAllLangPairs();
		            break;
		        }
		        case 'google':
		            $(elements.ifr_google).show();
		            ProcessGoogle(txt);
                    break;
            }

		    translatedText = [];
            if (txt !== '')
                RunTranslate(txt);

        $('.select_example').select2({
			minimumResultsForSearch: Infinity,
			width: "100%"
		});

		// for apertium/deepl
		oScrollApertiumDeepL = new PerfectScrollbar("#display", {suppressScrollX: true});
		$('#show_manually').click(function() {
            $(this).hide();
            $('#hide_manually').show();
            $('#enter_container').show();
        });
        $('#hide_manually').click(function() {
            $(this).hide();
            $('#show_manually').show();
            $('#enter_container').hide();
        });
        function delay(callback, ms) {
            var timer = 0;
            return function() {
                var context = this, args = arguments;
                clearTimeout(timer);
                timer = setTimeout(function () {
                    callback.apply(context, args);
                    }, ms || 0);
            };
        };
        $('#textarea').keyup(delay(function(e) {
            txt = document.getElementById("textarea").value;

            if (!isReadyToTranslate() && sTranslateServiceType === 'apertium') {
                console.log('Languages not loaded!');
                return false;
            }

            switch (window.Asc.plugin.info.editorType) {
                case 'word':
                case 'slide': {
                    if (txt !== "") {
                        RunTranslate(txt);
                    }
                    break;
                }
                case 'cell': {
                    RunTranslate(txt);
                }
                break;
            }
        }, 500));
        $('.select_example.language').on('change', function() {
            translatedText = [];
            if (txt !== '')
                RunTranslate(txt);
        })

        // for deepl
        $('#save').on('click', function() {
            $('#select_example').select2({
                minimumResultsForSearch: Infinity,
                width: "calc(100% - 24px)"
		    });
		    apikey = elements.api_value.value.trim();
		    if (apikey !== '') {
		        window.Asc.plugin.executeMethod("GetSelectedText", [], function(sText) {
                    document.getElementById('txt_shower').innerHTML = '';
                    var allParsedParas = SplitText(sText);
                    DelInvalidChars(allParsedParas);
                    var sParams = CreateParams(allParsedParas);
                    var target_lang = GetTargetLang('deepl');
                    TranslateDeepL(apikey, target_lang, sParams);
                });
            }
            else {
                if (!$('#txt_shower').hasClass('error'))
                    $('#txt_shower').toggleClass('error');
                if (!$('#api-value').hasClass('error_api'))
                    $('#api-value').toggleClass('error_api');
                if (!$('#api-value').hasClass('img_error'))
                    $('#api-value').toggleClass('img_error');
                container = document.getElementById('txt_shower').innerHTML = 'API key in empty!'
            }
        });
        $('#reconf').on('click', function() {
            apikey = '';
            saved_key = localStorage.getItem('deepL_Apikey');
            if (saved_key !== null) {
                elements.api_value.value = saved_key;
            }
            switchClass(elements.re_api, 'display-none', true)
            switchClass(elements.api_panel, 'display-none', false);
            $('#common-elements').hide();
            $('#language-panel').hide();
            $(elements.api_value).focus();
        })
        $(elements.api_value).focus(function(){
            if(this.value !== this.defaultValue){
                this.select();
            }
        });
    });
	window.Asc.plugin.button = function(id)
	{
		this.executeCommand("close", "");
	};

	window.onresize = function()
	{
		ifr.contentWindow.postMessage("update_scroll", '*');
	};

	window.Asc.plugin.onExternalMouseUp = function()
	{
		var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent("mouseup", true, true, window, 1, 0, 0, 0, 0,
			false, false, false, false, 0, null);

		document.dispatchEvent(evt);
	};

	window.Asc.plugin.onTranslate = function()
	{
		if (isIE) {
			var field = document.getElementById("h4");
			if (field)
				field.innerHTML = message = window.Asc.plugin.tr(message);
		}

	};

	window.Asc.plugin.onThemeChanged = function(theme)
	{
        window.Asc.plugin.onThemeChangedBase(theme);

        $('#show_manually, #hide_manually, #reconf, #change-service-label').css('border-color', window.Asc.plugin.theme.Color);
        if (theme.type === 'dark') {
            $('#arrow-dark').show();
            $('#arrow-light').hide();
        }
        else {
            $('#arrow-dark').hide();
            $('#arrow-light').show();
        }
	};

})(window, undefined);
