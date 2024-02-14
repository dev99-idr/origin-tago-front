/*!
 * pajinatify - A light-weight pagination plugin for jQuery
 *
 * Copyright 2018, Mehdi Dehghani
 * (http://www.github.com/dehghani-mehdi)
 *
 * @author   Mehdi Dehghani
 * @license  MIT
 *
 */
;

(function ($, window, document, undefined) {
    const pluginName = 'pajinatify',
        p = {},
        // -- Globals (shared across all plugin instances)
        defaults = {
            debug: false,
            onChange: null,
            dir: 'ltr'
        };

    let _this;

    p[pluginName] = class {
        constructor(el, config) {
            this.el = el;
            this.$el = $(el);

            this.config = $.extend({}, defaults, config);

            this._defaults = defaults;

            this.init();
            this.wireEvents();

            _this = this;
        }

        init() {
            this.$el.addClass('pajinatify').addClass(`pajinatify__${this.config.dir}`);

            let totalCount = this.$el.data('total-count'),
                take = this.$el.data('take');

            this.CURRENT_PAGE = this.CURRENT_PAGE || 1;

            this.TOTAL_PAGES = Math.floor(totalCount / take);
            if (totalCount % take != 0) this.TOTAL_PAGES++;

            if (this.config.debug) {
                console.log('init-------------------------------------');
                console.log(`total count: ${totalCount}`);
                console.log(`take: ${take}`);
                console.log(`current page: ${this.CURRENT_PAGE}`);
                console.log(`total pages: ${this.TOTAL_PAGES}`);
                console.log('-----------------------------------------');
            }

            if (this.TOTAL_PAGES > 1)
                this.$el.html(this.compute());
            else
                this.$el.empty();
        }

        wireEvents() {
            $('body').on('click', '.pajinatify__button', (e) => {
                e.preventDefault();

                let page = +$(e.currentTarget).attr('data-page');

                this.CURRENT_PAGE = page;

                this.$el.data('current', this.CURRENT_PAGE).html(this.compute());

                if (typeof this.config.onChange === 'function') this.config.onChange.call(this.$el, this.CURRENT_PAGE);

                this.$el.trigger('onChange', this.CURRENT_PAGE);
            });
        };

        compute() {
            let delta = 1,
                range = [],
                html = [],
                l,
                page;

            if (this.CURRENT_PAGE == this.TOTAL_PAGES) delta = 2;
            if (this.CURRENT_PAGE == this.TOTAL_PAGES - 1) delta = 2;

            if (this.CURRENT_PAGE == 1) delta = 2;
            if (this.CURRENT_PAGE == 2) delta = 2;

            range.push(1);
            for (let i = this.CURRENT_PAGE - delta, len = this.CURRENT_PAGE + delta; i <= len; i++) {
                if (i < this.TOTAL_PAGES && i > 1) {
                    range.push(i);
                }
            }
            if (this.TOTAL_PAGES != 1) range.push(this.TOTAL_PAGES);

            if (this.CURRENT_PAGE != 1) {
                page = +this.CURRENT_PAGE - 1;

                html.push($('<span />', {
                    class: 'pajinatify__button pajinatify__arrow arrow__prev',
                    attr: {
                        'data-page': page
                    }
                }));
            }

            for (let i of range) {
                if (l) {
                    if (i - l === 2) {
                        page = l + 1;

                        html.push($('<span />', {
                            text: page,
                            class: 'pajinatify__button',
                            attr: {
                                'data-page': page
                            }
                        }));

                    } else if (i - l !== 1) {
                        html.push($('<span />', {
                            text: '...'
                        }));
                    }
                }

                page = i;

                html.push($('<span />', {
                    text: page,
                    class: 'pajinatify__button' + (page == this.CURRENT_PAGE ? ' pajinatify__current' : ''),
                    attr: {
                        'data-page': page
                    }
                }));

                l = i;
            }

            if (this.CURRENT_PAGE != this.TOTAL_PAGES) {
                page = +this.CURRENT_PAGE + 1;

                html.push($('<span />', {
                    class: 'pajinatify__button pajinatify__arrow arrow__next',
                    attr: {
                        'data-page': page
                    }
                }));
            }

            return html;
        };
    }

    let destroy = ($el) => {
        if (!$el.is('div')) return;

        $el.removeClass('pajinatify').empty();

        $.removeData($el[0], 'plugin_' + pluginName);
    };

    let set = ($el, currentPage, totalCount) => {
        _this.CURRENT_PAGE = currentPage || _this.CURRENT_PAGE;

        let take = -1;
        if (totalCount) {
            take = $el.data('take');

            _this.TOTAL_PAGES = Math.floor(totalCount / take);
            if (totalCount % take != 0) _this.TOTAL_PAGES++;
        }

        _this.$el.html(_this.compute());

        if (_this.config.debug) {
            console.log('init-------------------------------------');
            console.log(`total count: ${totalCount}`);
            console.log(`take: ${take}`);
            console.log(`current page: ${_this.CURRENT_PAGE}`);
            console.log(`total pages: ${_this.TOTAL_PAGES}`);
            console.log('-----------------------------------------');
        }
    }

    $.fn[pluginName] = function (options) {
        if (typeof options === 'string') {
            switch (options) {
                case 'destroy':
                    destroy(this);
                    break;

                case 'set':
                    set(this, arguments[1], arguments[2]);
                    break;
            }

            return this;
        }

        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new p[pluginName](this, options));
            }
        });
    };
})(jQuery, window, document);