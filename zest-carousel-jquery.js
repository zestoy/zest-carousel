(function ($) {

  var methods = {

    init : function(options) {
      var defaults = {
        time_constant: 200, // ms
        dist: -100, // zoom scale TODO: make this more intuitive as an option
        shift: 0, // spacing for center image
        padding: 0, // Padding between non center items
        no_wrap: false, // Don't wrap around and cycle through items.
        width: "100%",
        height: "400px",
        perspective: "500px",
        itemWidth: "200px",
        itemHeight: "400px",
        imageWidth: "100%"
      };
      options = $.extend(defaults, options);

      return this.each(function() {

               var images, offset, center, pressed, dim, count,
                   reference, referenceY, amplitude, target, velocity,
                   xform, frame, timestamp, ticker, dragged, vertical_dragged;


               // Initialize
               var view = $(this);
               // add css styles
               this.style.overflow = 'hidden';
               this.style.position = 'relative';
               this.style.transformStyle = 'preserve-3d';
               this.style.transformOrigin = '0% 50%';
               this.style.width = options['width'];
               this.style.height = options['height'];
               this.style.perspective = options['perspective'];

               view.find('.carousel-item').each(function (i) {
                 this.style.display =  "none";
                 this.style.position =  "absolute";
                 this.style.top =  "0";
                 this.style.left =  "0";
                 this.style.width = options['itemWidth'];
                 this.style.height = options['itemHeight'];
               });
               view.find('.carousel-item img').each(function (i) {
                 this.style.width = options['imageWidth'];
               });

               // Don't double initialize.
               if (view.hasClass('initialized')) {
                 // Redraw carousel.
                 $(this).trigger('carouselNext', [0.000001]);
                 return true;
               }


               view.addClass('initialized');
               pressed = false;
               offset = target = 0;
               images = [];
               item_width = view.find('.carousel-item').first().innerWidth();
               dim = item_width * 2 + options.padding;
               view.find('.carousel-item').each(function (i) {
                 images.push($(this)[0]);
               });



               count = images.length;


               function setupEvents() {
                 if (typeof window.ontouchstart !== 'undefined') {
                   view[0].addEventListener('touchstart', tap);
                   view[0].addEventListener('touchmove', drag);
                   view[0].addEventListener('touchend', release);
                 }
                 view[0].addEventListener('mousedown', tap);
                 view[0].addEventListener('mousemove', drag);
                 view[0].addEventListener('mouseup', release);
                 view[0].addEventListener('mouseleave', release);
                 view[0].addEventListener('click', click);
               }

               function xpos(e) {
                 // touch event
                 if (e.targetTouches && (e.targetTouches.length >= 1)) {
                   return e.targetTouches[0].clientX;
                 }

                 // mouse event
                 return e.clientX;
               }

               function ypos(e) {
                 // touch event
                 if (e.targetTouches && (e.targetTouches.length >= 1)) {
                   return e.targetTouches[0].clientY;
                 }

                 // mouse event
                 return e.clientY;
               }

               function wrap(x) {
                 return (x >= count) ? (x % count) : (x < 0) ? wrap(count + (x % count)) : x;
               }

               function scroll(x) {
                 var i, half, delta, dir, tween, el, alignment, xTranslation;

                 offset = (typeof x === 'number') ? x : offset;
                 center = Math.floor((offset + dim / 2) / dim);
                 delta = offset - center * dim;
                 dir = (delta < 0) ? 1 : -1;
                 tween = -dir * delta * 2 / dim;
                 half = count >> 1;

                 alignment = 'translateX(' + (view[0].clientWidth - item_width) / 2 + 'px) ';
                 alignment += 'translateY(' + (view[0].clientHeight - item_width) / 2 + 'px)';

                 // center
                 // Don't show wrapped items.

                 if (!options.no_wrap || (center >= 0 && center < count)) {
                   
                   el = images[wrap(center)];
                   el.style[xform] = alignment +
                     ' translateX(' + (-delta / 2) + 'px)' +
                     ' translateX(' + (dir * options.shift * tween * i) + 'px)' +
                     ' translateZ(' + (options.dist * tween) + 'px)';
                   el.style.zIndex = 0;
                   
                   tweenedOpacity = 1 - 0.2 * tween;
                   el.style.opacity = tweenedOpacity;
                   el.style.display = 'block';
                 }

                 for (i = 1; i <= half; ++i) {
                   // right side
                   zTranslation = options.dist * (i * 2 + tween * dir);
                   tweenedOpacity = 1 - 0.2 * (i * 2 + tween * dir);
                   // Don't show wrapped items.
                   if (!options.no_wrap || center + i < count) {
                     el = images[wrap(center + i)];
                     el.style[xform] = alignment +
                       ' translateX(' + (options.shift + (dim * i - delta) / 2) + 'px)' +
                       ' translateZ(' + zTranslation + 'px)';
                     el.style.zIndex = -i;
                     el.style.opacity = tweenedOpacity;
                     el.style.display = 'block';
                   }


                   // left side
                   zTranslation = options.dist * (i * 2 - tween * dir);
                   tweenedOpacity = 1 - 0.2 * (i * 2 - tween * dir);
                   // Don't show wrapped items.
                   if (!options.no_wrap || center - i >= 0) {
                     el = images[wrap(center - i)];
                     el.style[xform] = alignment +
                       ' translateX(' + (-options.shift + (-dim * i - delta) / 2) + 'px)' +
                       ' translateZ(' + zTranslation + 'px)';
                     el.style.zIndex = -i;
                     el.style.opacity = tweenedOpacity;
                     el.style.display = 'block';
                   }
                 }

                 // center
                 // Don't show wrapped items.
                 if (!options.no_wrap || (center >= 0 && center < count)) {
                   el = images[wrap(center)];
                   el.style[xform] = alignment +
                     ' translateX(' + (-delta / 2) + 'px)' +
                     ' translateX(' + (dir * options.shift * tween) + 'px)' +
                     ' translateZ(' + (options.dist * tween) + 'px)';
                   el.style.zIndex = 0;
                   tweenedOpacity = 1 - 0.2 * tween; 
                   el.style.opacity = tweenedOpacity;
                   el.style.display = 'block';
                 }
               }

               function track() {
                 var now, elapsed, delta, v;

                     now = Date.now();
                 elapsed = now - timestamp;
                 timestamp = now;
                 delta = offset - frame;
                 frame = offset;

                 v = 1000 * delta / (1 + elapsed);
                 velocity = 0.8 * v + 0.2 * velocity;
               }

               function autoScroll() {
                 var elapsed, delta;

                     if (amplitude) {
                       elapsed = Date.now() - timestamp;
                       delta = amplitude * Math.exp(-elapsed / options.time_constant);
                       if (delta > 2 || delta < -2) {
                         scroll(target - delta);
                         requestAnimationFrame(autoScroll);
                       } else {
                         scroll(target);
                       }
                     }
               }

               function click(e) {
                 // Disable clicks if carousel was dragged.
                 if (dragged) {
                   e.preventDefault();
                   e.stopPropagation();
                   return false;

                 } else  {
                   var clickedIndex = $(e.target).closest('.carousel-item').index();
                   var diff = (center % count) - clickedIndex;

                   // Disable clicks if carousel was shifted by click
                   if (diff !== 0) {
                     e.preventDefault();
                     e.stopPropagation();
                   }
                   cycleTo(clickedIndex);
                 }
               }

               function cycleTo(n) {
                 var diff = (center % count) - n;

                 // Account for wraparound.
                 if (!options.no_wrap) {
                   if (diff < 0) {
                     if (Math.abs(diff + count) < Math.abs(diff)) { diff += count; }

                   } else if (diff > 0) {
                     if (Math.abs(diff - count) < diff) { diff -= count; }
                   }
                 }

                 // Call prev or next accordingly.
                 if (diff < 0) {
                   view.trigger('carouselNext', [Math.abs(diff)]);

                 } else if (diff > 0) {
                   view.trigger('carouselPrev', [diff]);
                 }
               }

               function tap(e) {
                 pressed = true;
                 dragged = false;
                 vertical_dragged = false;
                 reference = xpos(e);
                 referenceY = ypos(e);

                 velocity = amplitude = 0;
                 frame = offset;
                 timestamp = Date.now();
                 clearInterval(ticker);
                 ticker = setInterval(track, 100);

               }

               function drag(e) {
                 var x, delta, deltaY;
                 if (pressed) {
                   x = xpos(e);
                   y = ypos(e);
                   delta = reference - x;
                   deltaY = Math.abs(referenceY - y);
                   if (deltaY < 30 && !vertical_dragged) {
                     // If vertical scrolling don't allow dragging.
                     if (delta > 2 || delta < -2) {
                       dragged = true;
                       reference = x;
                       scroll(offset + delta);
                     }

                   } else if (dragged) {
                     // If dragging don't allow vertical scroll.
                     e.preventDefault();
                     e.stopPropagation();
                     return false;

                   } else {
                     // Vertical scrolling.
                     vertical_dragged = true;
                   }
                 }

                 if (dragged) {
                   // If dragging don't allow vertical scroll.
                   e.preventDefault();
                   e.stopPropagation();
                   return false;
                 }
               }

               function release(e) {
                 if (pressed) {
                   pressed = false;
                 } else {
                   return;
                 }

                 clearInterval(ticker);
                 target = offset;
                 if (velocity > 10 || velocity < -10) {
                   amplitude = 0.9 * velocity;
                   target = offset + amplitude;
                 }
                 target = Math.round(target / dim) * dim;

                 // No wrap of items.
                 if (options.no_wrap) {
                   if (target >= dim * (count - 1)) {
                     target = dim * (count - 1);
                   } else if (target < 0) {
                     target = 0;
                   }
                 }
                 amplitude = target - offset;
                 timestamp = Date.now();
                 requestAnimationFrame(autoScroll);

                 if (dragged) {
                   e.preventDefault();
                   e.stopPropagation();
                 }
                 return false;
               }

               xform = 'transform';
               ['webkit', 'Moz', 'O', 'ms'].every(function (prefix) {
                                                    var e = prefix + 'Transform';
                                                    if (typeof document.body.style[e] !== 'undefined') {
                                                      xform = e;
                                                      return false;
                                                    }
                                                    return true;
                                                  });



               window.onresize = scroll;

               setupEvents();
               scroll(offset);

               $(this).on('carouselNext', function(e, n) {
                                          if (n === undefined) {
                                            n = 1;
                                          }
                                          target = offset + dim * n;
                                          if (offset !== target) {
                                            amplitude = target - offset;
                                            timestamp = Date.now();
                                            requestAnimationFrame(autoScroll);
                                          }
                                        });

               $(this).on('carouselPrev', function(e, n) {
          if (n === undefined) {
            n = 1;
          }
          target = offset - dim * n;
                                                        if (offset !== target) {
                                                          amplitude = target - offset;
                                                          timestamp = Date.now();
                                                          requestAnimationFrame(autoScroll);
                                                        }
        });

               $(this).on('carouselSet', function(e, n) {
                                           if (n === undefined) {
                                             n = 0;
                                           }
                                           cycleTo(n);
                                         });

             });



    },
    next : function(n) {
      $(this).trigger('carouselNext', [n]);
    },
    prev : function(n) {
      $(this).trigger('carouselPrev', [n]);
    },
    set : function(n) {
      $(this).trigger('carouselSet', [n]);
    }
  };


    $.fn.carousel = function(methodOrOptions) {
      if ( methods[methodOrOptions] ) {
        return methods[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ));
      } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
        // Default to "init"
        return methods.init.apply( this, arguments );
      } else {
        $.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.carousel' );
      }
    }; // Plugin end

}( jQuery ));

