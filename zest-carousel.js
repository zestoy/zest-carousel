(function (window) {
  window.$ = document.querySelectorAll.bind(document);

  Node.prototype.on = window.on = function (name, fn) {
                        this.addEventListener(name, fn);
                      }

  NodeList.prototype.__proto__ = Array.prototype;
  NodeList.prototype.on = NodeList.prototype.addEventListener = function (name, fn) {
                                                           this.forEach(function (elem, i) {
                      elem.on(name, fn);
                    });
                                                         }
  var trigger = function(el, className, data) {
                             if (window.CustomEvent) {
                               var event = new CustomEvent('my-event', {detail: data});
                             } else {
                               var event = document.createEvent('CustomEvent');
                               event.initCustomEvent('my-event', true, true, data);
                             }

                             el.dispatchEvent(event);
                           }

  var addClass = function(el, className) {
       if (el.classList)
         el.classList.add(className);
       else
         el.className += ' ' + className;
     }

  var hasClass = function(el, className) {
             if (el.classList)
               el.classList.contains(className);
             else
               new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
           }


  var deepExtend = function(out, obj) {
  out = out || {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object')
        out[key] = deepExtend(out[key], obj[key]);
      else
        out[key] = obj[key];
    }
  }
  return out;
}

  var closest = function(el, selector) {
               var matchesFn;

               // find vendor prefix
               ['matches','webkitMatchesSelector','mozMatchesSelector','msMatchesSelector','oMatchesSelector'].some(function(fn) {
                                                                                                    if (typeof document.body[fn] == 'function') {
                                                                                                      matchesFn = fn;
                                                                                                      return true;
                                                                                                    }
                                                                                                    return false;
                                                                                                  })

               var parent;

               // traverse parents
               while (el) {
                 parent = el.parentElement;
                 if (parent && parent[matchesFn](selector)) {
                   return parent;
                 }
                 el = parent;
               }

               return null;
             }


  window.ZestCarousel = {

    init : function(query, options) {
               var defaults = {
                 time_constant: 200, // ms
                 dist: -100, // zoom scale 
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
                   options = deepExtend(defaults, options);

               var those = $(query);
                   return [].forEach.call(those, function(carouselElement) {
                                                var images, offset, center, pressed, dim, count,
                                                reference, referenceY, amplitude, target, velocity,
                                                    xform, frame, timestamp, ticker, dragged, vertical_dragged;


                                                    // Initialize
                                                    // add css styles
                                                carouselElement.style.overflow = 'hidden';
                                                carouselElement.style.position = 'relative';
                                                carouselElement.style.transformStyle = 'preserve-3d';
                                                carouselElement.style.transformOrigin = '0% 50%';
                                                carouselElement.style.width = options['width'];
                                                carouselElement.style.height = options['height'];
                                                carouselElement.style.perspective = options['perspective'];
                                                [].forEach.call(carouselElement.querySelectorAll('.carousel-item'), function(that) {
                                                                                              that.style.display =  "none";
                                                                                              that.style.position =  "absolute";
                                                                                              that.style.top =  "0";
                                                                                              that.style.left =  "0";
                                                                                              that.style.width = options['itemWidth'];
                                                                                              that.style.height = options['itemHeight'];
                                                                                            });

                                                [].forEach.call(carouselElement.querySelectorAll('.carousel-item img'), function(that) {
                                                                                                              that.style.width = options['imageWidth'];
                                                                                                            });

                                                // Don't double initialize.
                                                if (hasClass(carouselElement, 'initialized')) {
                                                  // Redraw carousel.
                                                  trigger(carouselElement, 'carouselNext', [0.000001]); 
                                                  return true;
                                                }


                                                addClass(carouselElement, 'initialized');
                                                pressed = false;
                                                offset = target = 0;
                                                images = [];
                                                item_width = parseInt(window.getComputedStyle(carouselElement.querySelectorAll('.carousel-item')[0]).width);
                                                dim = item_width * 2 + options.padding;
                                                [].forEach.call(carouselElement.querySelectorAll('.carousel-item'), function(that) {
                                                                                                    images.push(that);
                                                                                                  });



                                                count = images.length;



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
                                                  var i, half, delta, dir, tween, el, alignment;
                                                  offset = (typeof x === 'number') ? x : offset;
                                                  center = Math.floor((offset + dim / 2) / dim);
                                                  delta = offset - center * dim;
                                                  dir = (delta < 0) ? 1 : -1;
                                                  tween = -dir * delta * 2 / dim;
                                                  half = count >> 1;

                                                  alignment = 'translateX(' + (carouselElement.clientWidth - item_width) / 2 + 'px) ';
                                                  alignment += 'translateY(' + (carouselElement.clientHeight - item_width) / 2 + 'px)';

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
                                                    //var clickedIndex = closest(e.target, '.carousel-item').index(); 
                                                    // TODO ALPER
                                                    var clickedIndex = 1;
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
                                                    trigger(carouselElement, 'carouselNext', [Math.abs(diff)]);

                                                  } else if (diff > 0) {
                                                    trigger(carouselElement, 'carouselPrev', [diff]);
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
                                                if (typeof window.ontouchstart !== 'undefined') {
                                                  console.log(carouselElement);
                                                  carouselElement.addEventListener('touchstart', tap);
                                                  carouselElement.addEventListener('touchmove', drag);
                                                  carouselElement.addEventListener('touchend', release);
                                                }
                                                carouselElement.addEventListener('mousedown', tap);
                                                carouselElement.addEventListener('mousemove', drag);
                                                carouselElement.addEventListener('mouseup', release);
                                                carouselElement.addEventListener('mouseleave', release);
                                                carouselElement.addEventListener('click', click);

                                                scroll(offset);

                                                carouselElement.on('carouselNext', function(e, n) {
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

                 carouselElement.on('carouselPrev', function(e, n) {
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

                 carouselElement.on('carouselSet', function(e, n) {
                   if (n === undefined) {
                     n = 0;
                   }
                   cycleTo(n);
                 });

               });



      }
    };




  }( window ));





