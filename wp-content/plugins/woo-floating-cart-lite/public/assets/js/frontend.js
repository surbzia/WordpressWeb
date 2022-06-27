(function( $, window ) {
	'use strict';

	window.XT_WOOFC = window.XT_WOOFC || {};

	$.fn.mutated = function(cb, e) {
		e = e || { subtree:true, childList:true, characterData:true };
		$(this).each(function() {
			function callback(changes) { cb.call(node, changes, this); }
			let node = this;
			(new MutationObserver(callback)).observe(node, e);
		});
	};

	//jQuery Cache
	const $$ = (() => {
		let cache = {};
		return ((selector) => {
			if(selector === 'flush') {
				cache = {};
				return true;
			}
			return cache[selector] || ( cache[selector] = $(selector) );
		});
	})();

	const goBackSvg = '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" xml:space="preserve" style="display: inline-block;transform: rotate(180deg);margin-right: 8px;height: 40px;vertical-align: top;width: 20px;"><line fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" x1="3" y1="12" x2="21" y2="12"></line><polyline fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="15,6 21,12 15,18 "></polyline></svg>';

	const lang = (key) => {
		return XT_WOOFC.lang[key] ? XT_WOOFC.lang[key] : null;
	};

	const option = (key) => {
		return XT_WOOFC[key] ? XT_WOOFC[key] : null;
	};

	const optionIs = (key, value) => {
		return (option(key) === value);
	};

	const optionEnabled = (key) => {
		return (option(key) === "1");
	};

	const cart = {

		el: {
			singleAddToCartBtn: 'form .single_add_to_cart_button, .letiations .single_add_to_cart_button',
			wooPageNotices: '.woocommerce-notices-wrapper',
			wooNotices: '.xt_woofc-wc-notices',
			notice: '.xt_woofc-notice',
			container: '.xt_woofc',
			inner: '.xt_woofc-inner',
			wrapper: '.xt_woofc-wrapper',
			header: '.xt_woofc-header',
			title: '.xt_woofc-title',
			body: '.xt_woofc-body',
			bodyHeader: '.xt_woofc-body-header',
			bodyFooter: '.xt_woofc-body-footer',
			listWrap: '.xt_woofc-list-wrap',
			list: 'ul.xt_woofc-list',
			trigger: '.xt_woofc-trigger',
			counter: '.xt_woofc-count',
			checkoutButton: '.xt_woofc-checkout',
			shippingBarPerc: '.xt_woofc-shipping-bar-perc',
		},
		cartNoticeTimeoutId: null,
		undoTimeoutId: null,
		lastRemovedKey: null,
		suggestedProductsSlider: null,
		winWidth: null,
		cartWidth: null,
		isLoading: false,
		isActive: false,
		isEmpty: true,
		isTransitioning: false,
		isReady: false,
		couponsEnabled: false,
		couponsListEnabled: false,
		modalMode: false,
		ajaxInit: false,
		animationType: null,
		triggerEvent: null,
		hoverdelay: null,
		viewMode: 'desktop',
		triggers: [],

		init() {

			// wc_cart_fragments_params is required to continue, ensure the object exists
			if ( typeof wc_cart_fragments_params === 'undefined') {
				return false;
			}

			cart.initVars();
			cart.updateDynamicVars();
			cart.setTriggers();
			cart.removeUnwantedAjaxRequests();
			cart.initEvents();
			cart.resize();
			cart.setTriggerDefaultText();
			cart.refreshCartCountSize();
			cart.removeUnwantedElements();
			cart.refreshCartVisibility();
			cart.initMutationObserver();

			

			if(cart.ajaxInit) {

				cart.refreshCart(() => {

					cart.cartReady();
				});

			}else{

				cart.cartReady();
			}
		},

		initVars() {

			cart.modalMode = $$(cart.el.container).hasClass('xt_woofc-modal');
			cart.ajaxInit = $$(cart.el.container).attr('data-ajax-init') === '1' || optionEnabled('is_customize_preview');
			cart.triggers = [cart.el.trigger];
		},

		updateDynamicVars() {

			cart.couponsEnabled = optionEnabled('enable_coupon_form');
			cart.couponsListEnabled = optionEnabled('enable_coupon_list');
			cart.animationType = $$(cart.el.container).attr('data-animation');
			cart.triggerEvent = $$(cart.el.container).attr('data-trigger-event');
			cart.hoverdelay = $$(cart.el.container).attr('data-hoverdelay') ? $$(cart.el.container).attr('data-hoverdelay') : 0;
		},

		flushCache() {

			$$('flush');

			cart.updateDynamicVars();
		},

		setTriggers() {

			let triggers = option('trigger_selectors');

			if(triggers && triggers.length) {
				triggers.forEach((item) => {

					if(item.selector !== '') {
						cart.triggers.push(item.selector);
					}
				});
			}
		},

		removeUnwantedAjaxRequests() {

			// Remove unwanted ajax request (cart form submit) coming from native cart script.
			if(optionEnabled('enable_totals')) {

				$.ajaxPrefilter((options, originalOptions, jqXHR) => {
					if (originalOptions.url === '#woocommerce-cart-form') {
						jqXHR.abort();
					}
				});
			}

		},

		isSetDemoAction() {

			let params = new URLSearchParams(window.location.search);
			return params.get('action') === 'xt_set_demo';
		},

		initEvents() {

			if (cart.isSetDemoAction() && sessionStorage.getItem('wc_cart_created') !== null) {
				sessionStorage.removeItem('wc_cart_created');
				location.reload();
				return;
			}

			$( window ).on( "beforeunload", () => {

				if (cart.isSetDemoAction()) {
					sessionStorage.removeItem('wc_cart_created');
				}
			});

			// Needed for Cart Menu Item & Shortcode on all pages
			$(window).on('resize', () => {

				window.requestAnimationFrame(cart.resize);
			});

			if(!$$(cart.el.container).length) {
				return;
			}

			// Make sure to burst the cache and refresh the cart after a browser back button event
			$(window).on('pageshow', () => {

				if(!cart.isReady) {
					cart.refreshCart(() => {

						cart.cartReady();
					});
				}

			});

			$(document.body).on('xt_atc_adding_to_cart', () => {

				$$(cart.el.container).removeClass('xt_woofc-empty');
				cart.maybeShowNotice();
			});

			$(document.body).on('vclick', cart.el.notice, (evt) => {

				if($(evt.currentTarget).find('a').length === 0) {
					cart.hideNotice();
				}
			});

			// Update Cart List Obj
			$(document.body).on('wc_fragments_refreshed wc_fragments_loaded', () => {

				cart.onFragmentsRefreshed();
			});

			//open/close cart

			cart.triggers.forEach((trigger, i) => {

				const selector = i === 0 ? 'vclick' : 'click';

				$(document.body).on(selector, trigger, (evt) => {
					if($(cart.el.container).is(':visible')) {
						evt.preventDefault();
						evt.stopPropagation();
						cart.toggleCart();
					}
				});

				if($(trigger).hasClass('xt_woofc-trigger') && cart.triggerEvent === 'mouseenter' && !XT.isTouchDevice()) {

					let mouseEnterTimer;
					$(trigger).on('mouseenter', (evt) => {

						mouseEnterTimer = setTimeout(() => {

							if(!cart.isActive) {
								evt.preventDefault();
								cart.toggleCart();
							}

						}, cart.hoverdelay);

					}).on('mouseleave', () => {

						clearTimeout(mouseEnterTimer);
					});

				}
			});

			//close cart when clicking on the .xt_woofc::before (bg layer)
			$$(cart.el.container).on('vclick', (evt) => {
				if( evt.target === evt.currentTarget ) {
					cart.toggleCart(false);
				}
			});

			//delete an item from the cart
			$$(cart.el.body).on('vclick', '.xt_woofc-delete-item', (evt) => {
				evt.preventDefault();

				// Simulate native cart remove to keep analytics / tracking plugins working as they should
				let $quantityInput = $(evt.currentTarget).closest('li').find('.xt_woofc-quantity-row input');
				let quantity = $quantityInput.length ? $quantityInput.val() : 0;

				let $clone = $(evt.currentTarget).clone().addClass('remove').removeClass('xt_woofc-delete-item').hide();
				$(evt.currentTarget).parent().append($clone);

				let $wrap = $clone.wrap('<span class="mini_cart_item"></span>').parent();
				$wrap.hide().append('<span class="quantity">'+quantity+'></span>');

				$clone.trigger('click');

				let key = $(evt.target).parents('.xt_woofc-product').data('key');
				cart.removeProduct(key);
			});

			//update item quantity

			$( document ).on('keyup', '.xt_woofc-quantity-row input', (evt) => {

				let $target = $(evt.currentTarget);
				cart.updateQuantityInputWidth($target);
			});

			$( document ).on('change', '.xt_woofc-quantity-row input', (evt) => {

				evt.preventDefault();

				let $target = $(evt.currentTarget);

				let $parent = $target.parent();
				let min = parseFloat( $target.attr( 'min' ) );
				let max	= parseFloat( $target.attr( 'max' ) );

				if ( min && min > 0 && parseFloat( $target.val() ) < min ) {

					$target.val( min );
					cart.setNotice(lang('min_qty_required'), 'error', $parent);
					return;

				}else if ( max && max > 0 && parseFloat( $target.val() ) > max ) {

					$target.val( max );
					cart.setNotice(lang('max_stock_reached'), 'error', $parent);
					return;

				}

				let product = $target.closest('.xt_woofc-product');
				let qty = $target.val();
				let key = product.data('key');

				cart.updateQuantityInputWidth($target);
				cart.updateProduct(key, qty);
			});

			let quantityChangeTimeout;
			$( document ).on( 'vclick', '.xt_woofc-quantity-col-minus, .xt_woofc-quantity-col-plus', (evt) => {

				evt.preventDefault();

				if(quantityChangeTimeout) {
					clearTimeout(quantityChangeTimeout);
				}

				let $target = $(evt.currentTarget);

				// Get values

				let $parent 	= $target.closest( '.xt_woofc-quantity-row' ),
					$qty_input	= $parent.find( 'input' ),
					currentVal	= parseFloat( $qty_input.val() ),
					max			= parseFloat( $qty_input.attr( 'max' ) ),
					min			= parseFloat( $qty_input.attr( 'min' ) ),
					step		= $qty_input.attr( 'step' ),
					newQty		= currentVal;

				// Format values
				if ( ! currentVal || isNaN(currentVal)) {
					currentVal = 0;
				}
				if (isNaN(max)) {
					max = 0;
				}
				if (isNaN(min)) {
					min = 0;
				}
				if ( step === 'any' || step === '' || step === undefined || isNaN(step) ) {
					step = 1;
				}

				// Change the value
				if ( $target.is( '.xt_woofc-quantity-col-plus' ) ) {

					if ( max && ( max === currentVal || currentVal > max ) ) {
						cart.setNotice(lang('max_stock_reached'), 'error', $parent);
						return;
					} else {
						newQty = ( currentVal + parseFloat( step ) );
					}

				} else {

					if ( min && ( min === currentVal || currentVal < min ) ) {
						cart.setNotice(lang('min_qty_required'), 'error', $parent);
						return;
					} else if ( currentVal > 0 ) {
						newQty = ( currentVal - parseFloat( step ) );
					}

				}

				// Trigger change event

				let product = $qty_input.closest('.xt_woofc-product');
				let key = product.data('key');

				if(currentVal !== newQty) {

					$qty_input.val(newQty);

					// throttle update
					quantityChangeTimeout = setTimeout(() => {

						// Update product quantity
						cart.updateProduct(key, newQty);

					}, 500);
				}
			});


			//reinsert item deleted from the cart
			$(document.body).on('vclick', '.xt_woofc-undo', (evt) => {

				if(cart.undoTimeoutId) {
					clearInterval(cart.undoTimeoutId);
				}
				evt.preventDefault();

				cart.hideNotice(true);
				cart.showLoading(true);

				let timeout = 0;
				let key = cart.lastRemovedKey;

				let product = $$(cart.el.list).find('.xt_woofc-deleted');
				let lastProduct = product.last();

				const onAnimationEnd = (el) => {

					el.removeClass('xt_woofc-deleted xt_woofc-undo-deleted').removeAttr('style');
					cart.refreshCartVisibility();
				};

				const onLastAnimationEnd = () => {

					cart.autoHeight();

					cart.undoProductRemove(key, () => {
						$( document.body ).trigger( 'xt_woofc_undo_product_remove', [ key ] );
					});
				};

				$$(cart.el.container).removeClass('xt_woofc-empty');

				cart.animationEnd(lastProduct, true, onLastAnimationEnd);

				product.each(function() {

					let $this = $(this);

					cart.animationEnd($this, true, onAnimationEnd);

					setTimeout(() => {

						$this.addClass('xt_woofc-undo-deleted');

					}, timeout);

					timeout = timeout + 270;

				});

				$$(cart.el.list).find('.xt_woofc-deleting-last').removeClass('xt_woofc-deleting-last');

			});

			$(document).on('wc_update_cart', () => {

				cart.refreshCart();
			});

			$(document.body).on('xt_woofc_after_hide_footer', () => {
				cart.checkoutButtonIdle();
			});

			$(document.body).on('xtfw_customizer_xt_woofc_changed', (e, setting_id, setting_value) => {

				if(XT_WOOFC.hasOwnProperty(setting_id)) {
					XT_WOOFC[setting_id] = setting_value;
				}

				cart.onFragmentsRefreshed();
			});

			$(document.body).on('xtfw_customizer_saved', () => {
				cart.refreshCart();
			});

			$(document).on('vclick', cart.el.checkoutButton, (evt) => {

				if(cart.isLoading) {
					evt.preventDefault();
					evt.stopPropagation();
					return;
				}

				

				cart.checkoutButtonProcessing();
				cart.updateCartButtonLabel('wait');

			});

			

		},

		showLoading(hideContent = false) {

			if(cart.isLoading) {
				return;
			}

			cart.isLoading = true;
			$$('html').removeClass('xt_woofc-stoploading').addClass('xt_woofc-loading');

			if(hideContent) {
				$$('html').addClass('xt_woofc-loading-hide-content');
			}
		},

		hideLoading() {

			if(!cart.isLoading) {
				return;
			}

			let loadingTimout = $$(cart.el.container).attr('data-loadingtimeout') ? parseInt($$(cart.el.container).attr('data-loadingtimeout')) : 0;

			setTimeout(() => {

				$$('html').removeClass('xt_woofc-loading-hide-content');
				$$('html').addClass('xt_woofc-stoploading');

				setTimeout(() => {
					$$('html').removeClass('xt_woofc-stoploading xt_woofc-loading');
					cart.isLoading = false;
				}, 310);

			}, cart.isActive ? loadingTimout + 100 : 0);
		},

		enableBodyScroll($el) {

			bodyScrollLock.enableBodyScroll($el.get(0));
		},

		disableBodyScroll($el) {

			bodyScrollLock.disableBodyScroll($el.get(0));
		},

		digitsCount(n) {

			let count = 0;
			if (n >= 1) ++count;

			while (n / 10 >= 1) {
				n /= 10;
				++count;
			}
			return count;
		},

		updateQuantityInputWidth(input) {

			let qty = $(input).val();
			let digits = cart.digitsCount(qty);
			let width = 25 * (digits / 2) + 'px';
			if(digits < 2) {
				width = 25;
			}
			$( input ).css('width', width);
		},

		autoHeight() {

			

			$$(cart.el.inner).css('height', '');

		},

		

		resize() {

			let layouts = option('layouts');

			cart.winWidth = $(window).width();

			if(cart.winWidth <= layouts.S) {

				cart.viewMode = 'mobile';

				$('body').removeClass('xt_woofc-is-desktop xt_woofc-is-tablet').addClass('xt_woofc-is-mobile');

			}else if(cart.winWidth <= layouts.M) {

				cart.viewMode = 'tablet';

				$('body').removeClass('xt_woofc-is-desktop xt_woofc-is-mobile').addClass('xt_woofc-is-tablet');

			}else{

				cart.viewMode = 'desktop';

				$('body').removeClass('xt_woofc-is-mobile xt_woofc-is-tablet').addClass('xt_woofc-is-desktop');

			}

			if($$(cart.el.container).length) {

				cart.cartWidth = $$(cart.el.inner).width();

				if (cart.cartWidth <= layouts.XS) {

					$$(cart.el.container).addClass('xt_woofc-narrow-cart xt-framework-notice-narrow');

				} else {

					$$(cart.el.container).removeClass('xt_woofc-narrow-cart xt-framework-notice-narrow');
				}
			}

			$(document.body).trigger('xt_woofc_resize', [cart.viewMode]);

			

			setTimeout(() => {
				cart.refreshCartVisibility();
			}, 10)

		},

		initMutationObserver() {

			if(cart.isReady) {
				return false;
			}

			$('body').mutated((changes) => {

				if(cart.isReady) {
					return false;
				}

				changes.some((change) => {

					return Array.prototype.slice.call(change.addedNodes).some((item) => {

						if($(item).hasClass('add_to_cart_button') || $(item).hasClass('single_add_to_cart_button')) {

							cart.flushCache();
							cart.setTriggerDefaultText();

							return true;
						}

					});
				});
			});
		},

		initScrollObserver() {

			let resize_observer = new ResizeObserver(() => {
				cart.autoHeight();
			});

			$$(cart.el.body).children().each((index, child) => {
				resize_observer.observe(child);
			});
		},

		setTriggerDefaultText() {

			if($$(cart.el.singleAddToCartBtn).length > 0) {

				$$(cart.el.singleAddToCartBtn).each(function() {

					$(this).data('defaultText', $(this).html().trim());

					if($(this).data('defaultText') !== '') {
						$(this).html(lang('wait'));
					}

					$(this).data('loading', true).addClass('loading');

				});
			}
		},

		resetTriggerDefaultText() {

			$$(cart.el.singleAddToCartBtn).each(function() {

				$(this).removeData('loading').removeClass('loading');

				if($(this).data('defaultText') !== '') {
					$(this).html($(this).data('defaultText'));
				}

			});
		},

		transitionEnd(el, once, callback) {

			let events = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';

			if(once) {

				el.one(events, (evt) => {

					$(this).off(events);

					evt.stopPropagation();
					callback($(this));
				});

			}else{

				el.on(events, function(evt) {

					evt.stopPropagation();
					callback($(this));
				});
			}
		},

		transitionEndClear(el) {

			el.off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend');
		},

		animationEnd(el, once, callback) {

			let events = 'webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend';

			if(once) {

				el.one(events, function(evt) {

					$(this).off(events);

					evt.stopPropagation();
					callback($(this));
				});

			}else{

				el.on(events, function(evt) {

					evt.stopPropagation();
					callback($(this));
				});
			}
		},

		clearCartConfirm() {

			cart.setNotice(lang('clear_confirm'), 'error');
		},

		clearCart() {

			cart.hideNotice(true);

			cart.request('clear');
		},

		clearCartRestore() {

			cart.hideNotice(true);

			cart.request('clear_restore');
		},

		toggleCart(flag = null) {

			if(cart.isTransitioning || cart.isLoading) {
				return false;
			}

			cart.isTransitioning = true;

			let action;

			if(flag) {
				action = flag ? 'open' : 'close';
			}else{
				action = cart.isActive ? 'close' : 'open';
			}

			cart.transitionEnd($$(cart.el.wrapper), true, () => {

				cart.isTransitioning = false;

				if (cart.isActive) {

					$$(cart.el.container).addClass('xt_woofc-cart-opened');
					$$(cart.el.container).removeClass('xt_woofc-cart-closed');

					// needed for custom payment buttons
					$(document.body).trigger('wc_fragments_loaded');

					cart.hideNotice();
					cart.hideLoading();

					$(document.body).trigger('xt_woofc_on_opened');

				} else {

					if(cart.modalMode) {
						$$(cart.el.wrapper).css('transition', 'none');
					}
					$$(cart.el.container).removeClass('xt_woofc-cart-opened');
					$$(cart.el.container).addClass('xt_woofc-cart-closed');

					if(cart.modalMode) {
						setTimeout(() => {
							$$(cart.el.wrapper).css('transition', '');
						}, 100)
					}

					$(document.body).trigger('xt_woofc_on_closed');

				}

				cart.refreshCartVisibility();
				cart.autoHeight();

			});

			if( action === 'close' && cart.isActive) {

				cart.isActive = false;

				$$(cart.el.container).removeClass('xt_woofc-cart-open');
				$$(cart.el.container).addClass('xt_woofc-cart-close');

				$(document.body).trigger('xt_woofc_on_closing');

				if(optionEnabled('body_lock_scroll')) {
					cart.enableBodyScroll($$(cart.el.body));
				}

				cart.resetUndo();
				cart.hideNotice();

				setTimeout(() => {
					$$(cart.el.body).scrollTop(0);
					//check if cart empty to hide it
					cart.refreshCartVisibility();

					

				}, 500);

			} else if( action === 'open' && !cart.isActive) {

				$(document.body).trigger('xt_woofc_on_opening');

				cart.isActive = true;

				$$(cart.el.container).removeClass('xt_woofc-cart-close');
				$$(cart.el.container).addClass('xt_woofc-cart-open');

				if(optionEnabled('body_lock_scroll')) {
					cart.disableBodyScroll($$(cart.el.body));
				}

				

				cart.autoHeight();
				cart.hideNotice();

			}

		},

		getCartPosition(viewMode) {

			let position_key = viewMode !== 'desktop' ? 'data-'+viewMode+'-position' : 'data-position';

			return $$(cart.el.container).attr(position_key);
		},

		

		findLoopImage(trigger, callback) {

			if(trigger.data('product_image_src')) {

				let imageData = {
					src: trigger.data('product_image_src'),
					width: trigger.data('product_image_width'),
					height: trigger.data('product_image_height')
				};

				cart.createFlyToCartImage(imageData, (img) => {

					callback(img);
				});

			}else{

				callback(null);
			}
		},

		findSingleImage(trigger, callback) {

			let imageData, fromElem;
			const form = trigger.closest('form');
			const product = trigger.closest('.product');
			const is_letiable = form.hasClass('letiations_form');

			if(is_letiable) {

				let letiation_id = parseInt(form.find('input[name=letiation_id]').val());
				let letiations = form.data('product_letiations');
				let letiation = letiations ? letiations.find((item) => {
					return item.letiation_id === letiation_id;
				}) : null;

				if(letiation && letiation.image && letiation.image.src !== '') {

					imageData = {
						src: letiation.image.src,
						width: letiation.image.src_w,
						height: letiation.image.src_h
					};
				}
			}

			if(!imageData && product.length) {

				fromElem = product.find('.xtfw-wc-product-image img');

				if(fromElem.length) {

					imageData = {
						src: fromElem.attr('src'),
						width: fromElem.attr('width'),
						height: fromElem.attr('height')
					};
				}
			}

			if(!imageData) {

				fromElem = form.find('.xt_woofc-product-image');

				if (fromElem.length && fromElem.data('product_image_src')) {

					imageData = {
						src: fromElem.data('product_image_src'),
						width: fromElem.data('product_image_width'),
						height: fromElem.data('product_image_height')
					};
				}
			}

			if(imageData) {

				cart.createFlyToCartImage(imageData, (img) => {

					callback(img);
				});

			}else{

				callback(null);
			}
		},

		createFlyToCartImage(imageData, callback) {

			let item = $('<img>');
			item.attr('src', imageData.src);
			item.attr('width', imageData.width);
			item.attr('height', imageData.height);

			item.css({
				width: imageData.width + 'px',
				height: imageData.height + 'px'
			});

			item.on('load', function() {
				callback($(this));
			});

			item.on('error', function() {
				callback(null);
			});

		},

		request(type, args, callback) {

			$(document.body).trigger('xt_woofc_request_start', [args]);

			cart.removeAllBodyNotices();
			cart.showLoading();

			if(type !== 'remove' && type !== 'restore' && type !== 'clear' && type !== 'clear_restore') {
				cart.lastRemovedKey = null;
				cart.hideNotice();
			}

			if(type === 'refresh' || type === 'totals') {

				cart.refreshFragments(type, callback);
				return false;
			}

			args = $.extend(args, {type: type});

			$.XT_Ajax_Queue({

				url: cart.get_url('xt_woofc_'+type),
				data: args,
				type: 'post'

			}).done((data) => {

				cart.flushCache();

				$(document.body).trigger('xt_woofc_request_done');

				if(type === 'restore' || type === 'clear_restore') {
					cart.refreshCart(callback);
				}else {
					cart.onRequestDone(data, type, callback);
				}
			});
		},

		refreshFragments(type, callback) {

			$.XT_Ajax_Queue({
				url: cart.get_url('get_refreshed_fragments'),
				data: {
					type: type
				},
				type: 'post'

			}).done((data) => {

				cart.onRequestDone(data, type, callback);
			});
		},

		onRequestDone(data, type, callback = null) {

			$.each( data.fragments, ( key, value ) => {

				$(key).replaceWith(value);
			});

			if (type !== 'add') {

				$(document.body).trigger('wc_fragments_refreshed');

			} else {

				cart.onFragmentsRefreshed();
			}

			cart.hideLoading();

			if(callback) {
				callback(data);
			}
		},

		onFragmentsRefreshed() {

			cart.flushCache();
			cart.removeUnwantedElements();
			cart.refreshCartCountSize();
			cart.maybeShowNotice();
			cart.refreshCartVisibility();

			if(cart.hasErrors()) {
				$( document.body ).trigger( 'xt_woofc_has_errors' );
			}

			setTimeout(() => {
				cart.autoHeight();
			}, 100);

			

		},

		updateProduct(key, qty, callback = null) {

			if(qty > 0) {

				cart.request('update', {

					cart_item_key: key,
					cart_item_qty: qty

				}, (data) => {

					$( document.body ).trigger( 'xt_woofc_product_update', [ key, qty ] );

					if(callback) {
						callback(data);
					}

				});

			}else{
				cart.removeProduct(key, callback);
			}
		},

		removeProduct(key, callback = null) {

			cart.showLoading(true);
			cart.lastRemovedKey = key;

			cart.request('remove', {

				cart_item_key: key

			}, () => {

				cart.resetUndo();

				let timeout = 0;
				let product = $$(cart.el.list).find('li[data-key="'+key+'"]');
				let isBundle = product.hasClass('xt_woofc-bundle');
				let isComposite = product.hasClass('xt_woofc-composite');
				let toRemove = [];
				let $prev;
				let $next;

				toRemove.push(product);

				if(isBundle || isComposite) {

					let selector = '';
					let group_id = product.data('key');

					if(isBundle) {
						selector += '.xt_woofc-bundled-item[data-group="'+group_id+'"]';
					}else{
						selector += '.xt_woofc-composite-item[data-group="'+group_id+'"]';
					}

					let groupedProducts = $($$(cart.el.list).find(selector).get().reverse());

					groupedProducts.each(function() {
						toRemove.push($(this));
					});
				}

				toRemove.reverse().forEach(($item) => {

					setTimeout(() => {

						$prev = $item.prev();
						if($prev.length && $item.is(':last-of-type')) {
							$prev.addClass('xt_woofc-deleting-last');
						}

						$next = $item.next();
						if($next.length) {
							$next.css('--xt-woofc-list-prev-item-height', $item.outerHeight(true) + 'px');
						}

						$item.addClass('xt_woofc-deleted');

					}, timeout);

					timeout = timeout + 270;

				});

				setTimeout(() => {

					cart.refreshCartVisibility();
					cart.autoHeight();

					$( document.body ).trigger( 'xt_woofc_product_removed', [ key ] );

					//wait 8sec before completely remove the item
					cart.undoTimeoutId = setTimeout(() => {

						$( document.body ).trigger( 'xt_woofc_product_dom_removed', [ key ] );

						cart.resetUndo();
						cart.hideNotice();
						$$(cart.el.list).find('.xt_woofc-deleting-last').removeClass('xt_woofc-deleting-last');

						if(callback) {
							callback();
						}

					}, 8000);

				}, timeout);
			});

		},

		hideCartTitle() {

			if(cart.noticeCollidingWithTitle()) {
				$$(cart.el.title).css({'opacity': 0.3, 'transform': 'translateX(-150%)'});
			}
		},

		showCartTitle() {
			$$(cart.el.title).css({'opacity': 1, 'transform': 'translateX(0)'});
		},

		noticeCollidingWithTitle() {

			let maxWidth = $(cart.el.header).width() - $(cart.el.title).outerWidth(true);
			$('.xt_woofc-header-action').each(function() {

				maxWidth -= $(this).outerWidth(true);
			});

			return $(cart.el.notice).outerWidth(true) >= maxWidth;
		},

		shakeElement(elemToShake, type = null) {
			if(elemToShake && elemToShake.length) {
				const selector = 'xt_woofc-shake' + (type ? '-'+type : '');
				cart.animationEnd(elemToShake, true, () => {
					elemToShake.removeClass(selector);
				});
				elemToShake.addClass(selector);
			}
		},

		hideNotice(hideCouponToggle = false) {

			$(document.body).trigger('xt_woofc_before_hide_notice', [hideCouponToggle]);

			if(cart.el.noticeTimeoutId) {
				clearTimeout(cart.el.noticeTimeoutId);
			}

			$$(cart.el.notice).removeClass('xt_woofc-visible');

			cart.showCartTitle();
			cart.transitionEnd($$(cart.el.notice), true, () => {
				$$(cart.el.notice).empty();
				$(document.body).trigger('xt_woofc_after_hide_notice', [hideCouponToggle]);
			});
		},

		showNotice(elemToShake = null) {

			cart.transitionEndClear($$(cart.el.notice));

			$(document.body).trigger('xt_woofc_before_show_notice', [elemToShake]);

			let timeout = elemToShake ? 100 : 0;

			$$(cart.el.notice).removeClass('xt_woofc-visible');

			if(elemToShake) {

				cart.shakeElement(elemToShake);
			}

			setTimeout(() => {

				$$(cart.el.notice).addClass('xt_woofc-visible');
				cart.hideCartTitle();

				if(cart.noticeHasError()) {

					cart.shakeElement($$(cart.el.notice));

					if(elemToShake) {

						cart.shakeElement(elemToShake);
					}
				}

				if(cart.el.noticeTimeoutId) {
					clearTimeout(cart.el.noticeTimeoutId);
				}

				if($$(cart.el.notice).find('a').length === 0) {
					cart.el.noticeTimeoutId = setTimeout(() => {
						cart.hideNotice();
					}, 6000);
				}

				$(document.body).trigger('xt_woofc_after_show_notice', [elemToShake]);

			}, timeout);
		},

		maybeShowNotice() {

			if($$(cart.el.notice).length && $$(cart.el.notice).html().trim() !== '') {
				cart.showNotice();
			}
		},

		noticeHasError() {

			return $$(cart.el.notice).data('type') === 'error';
		},

		setNotice(notice, type = 'success', elemToShake = null) {

			if(!cart.isActive) {
				return;
			}

			$$(cart.el.notice).removeClass (function (index, className) {
				return (className.match (/(^|\s)xt_woofc-notice-\S+/g) || []).join(' ');
			});

			$$(cart.el.notice).data('type', type).addClass('xt_woofc-notice-'+type).html(notice);

			cart.showNotice(elemToShake);
		},

		resetUndo() {

			if(cart.undoTimeoutId) {
				clearInterval(cart.undoTimeoutId);
			}

			$$(cart.el.list).find('.xt_woofc-deleted').remove();
		},

		undoProductRemove(key, callback) {

			cart.request('restore', {

				cart_item_key: key,

			}, callback);
		},

		hasErrors() {

			return $$(cart.el.container).find('.woocommerce-error').length > 0;
		},

		getFirstError() {

			return $$(cart.el.container).find('.woocommerce-error').first();
		},

		refreshCart(callback = null) {

			cart.request('refresh', {}, () => {

				if(callback) {
					callback();
				}
			});
		},

		refreshCartVisibility() {

			if( $$(cart.el.list).find('li:not(.xt_woofc-deleted):not(.xt_woofc-no-product)').length === 0) {
				$$(cart.el.container).addClass('xt_woofc-empty');
				cart.isEmpty = true;
				$(document.body).trigger('xt_woofc_emptied');
			}else{
				$$(cart.el.container).removeClass('xt_woofc-empty');
				cart.isEmpty = false;
			}

			$(document.body).trigger('xt_woofc_refresh_visibility');

		},

		refreshCartCountSize() {

			let quantity = Number($$(cart.el.counter).find('li').eq(0).text());

			if(quantity > 999) {

				$$(cart.el.counter).removeClass('xt_woofc-count-big');
				$$(cart.el.counter).addClass('xt_woofc-count-bigger');

			}else if(quantity > 99) {

				$$(cart.el.counter).removeClass('xt_woofc-count-bigger');
				$$(cart.el.counter).addClass('xt_woofc-count-big');

			}else{

				$$(cart.el.counter).removeClass('xt_woofc-count-big');
				$$(cart.el.counter).removeClass('xt_woofc-count-bigger');
			}

			$(document.body).trigger('xt_woofc_refresh_counter_size', [quantity]);

		},

		removeUnwantedElements() {

			if($$(cart.el.body).find('.woocommerce-cart-form').length > 1) {
				$$(cart.el.body).find('.woocommerce-cart-form').each(function(i) {
					if(i > 0) {
						$(this).remove();
					}
				});
				$$(cart.el.body).find('.woocommerce-cart-form').empty();
			}

			if($$(cart.el.body).find('.woocommerce-notices-wrapper').length) {
				$$(cart.el.body).find('.woocommerce-notices-wrapper').remove();
			}

			if($$(cart.el.body).find('.woocommerce-form-coupon,.woocommerce-form-coupon-toggle').length) {
				$$(cart.el.body).find('.woocommerce-form-coupon,.woocommerce-form-coupon-toggle').remove();
			}

			if(optionEnabled('enable_totals') && $$(cart.el.body).find('.angelleye-proceed-to-checkout-button-separator').length) {

				setTimeout(() => {
					$$(cart.el.body).find('.angelleye-proceed-to-checkout-button-separator').insertAfter($$(cart.el.body).find('.angelleye_smart_button_bottom'));
				},100);
			}
		},

		scrollTo(top, instant = false) {

			if(instant) {
				$$(cart.el.body).scrollTop(top);
				return;
			}

			$$(cart.el.body).animate({scrollTop: top}, 400);

			setTimeout(() => {
				$$(cart.el.body).animate({scrollTop: top}, 400);
			}, 100);
		},

		scrollToTop(instant = false) {

			cart.scrollTo(0, instant);
		},

		scrollToBottom(instant = false) {

			cart.scrollTo($$(cart.el.body).get(0).scrollHeight, instant);
		},

		removeAllBodyNotices() {

			let $notices = $$(cart.el.bodyFooter).find('.woocommerce-error, .woocommerce-message');
			if($notices.length) {
				$notices.each(function() {
					$(this).slideUp("fast", function() {
						$(this).remove();
					});
				});
			}
		},

		checkoutButtonProcessing() {

			$$(cart.el.checkoutButton).addClass('xt_woofc-processing');
		},

		checkoutButtonIdle() {

			$$(cart.el.checkoutButton).removeClass('xt_woofc-processing');
		},

		resetCheckoutButtonLabel(label = null) {

			label = label ? label : 'checkout';

			

			cart.checkoutButtonIdle();
			cart.updateCartButtonLabel(label);
		},

		cartReady() {

			cart.resetTriggerDefaultText();
			cart.resetCheckoutButtonLabel();

			$$(cart.el.container).addClass('xt_woofc-cart-closed');
			$('body').addClass('xt_woofc-ready');

			cart.resize();
			$(document.body).trigger('xt_woofc_ready');

			cart.isReady = true;
		},

		get_url( endpoint ) {
			return option('wc_ajax_url').toString().replace(
				'%%endpoint%%',
				endpoint
			);
		},

		updateCartTitle(title_key) {

			let svg = '';

			if(title_key === 'checkout') {
				svg += '<a href="#" class="xt_woofc-close-checkout" title="'+lang('back_to_cart')+'">'+goBackSvg+'</a>';
			}else if(title_key === 'coupons') {
				svg = '<a href="#" class="xt_woofc-close-coupon-form" title="' + lang('back_to_cart') + '">' + goBackSvg + '</a>'
			}

			$$(cart.el.title).hide().html(svg+lang(title_key)).fadeIn("fast");
		},

		updateCartButtonLabel(label_key) {

			$$(cart.el.checkoutButton).find('.xt_woofc-footer-label').text(lang(label_key));
		},

		

	};

	

	$(function() {

		cart.init();

		

	});

	window.xt_woofc_is_loading = () => cart.isLoading;
	window.xt_woofc_is_cart_open = () => cart.isActive;
	window.xt_woofc_is_cart_empty = () => cart.isEmpty;
	window.xt_woofc_show_loading = (...args) => cart.showLoading(...args);
	window.xt_woofc_hide_loading = () => cart.hideLoading();
	window.xt_woofc_refresh_cart = (...args) => cart.refreshCart(...args);
	window.xt_woofc_toggle_cart = (...args) => cart.toggleCart(...args);
	window.xt_woofc_open_cart = () => cart.toggleCart(true);
	window.xt_woofc_close_cart = () => cart.toggleCart(false);
	window.xt_woofc_refresh_visibility = () => cart.refreshCartVisibility();
	window.xt_woofc_scroll_to = (...args) => cart.scrollTo(...args);
	window.xt_woofc_scroll_to_top = (...args) => cart.scrollToTop(...args);
	window.xt_woofc_scroll_to_bottom = (...args) => cart.scrollToBottom(...args);

	

})( jQuery, window);