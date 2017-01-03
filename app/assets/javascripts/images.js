function encode (binary) {
  return Base64a.encode(new Uint8Array(binary));
}

var cache = {};

function normalizeKey(base) {
  if (typeof base !== 'string') {
    base = binaryToSrc[encode(base)];
  }
  return CybozuLabs.SHA1.calc(base);
}

var failed = function (err) {
  console.log('fail', err);
  loading.hide();
};

function verify (face, callback) {
  var faceIds = {
    male: "43a1b1ad-6a95-45e2-88c8-e060a3c17c28",
    female: "3e276377-3904-4bb9-9da5-1e861534b42f"
  };
  var sendFaceId = function (face) {
    return $.ajax({
      type: "POST",
      url: 'images/verify',
      contentType: "application/json",
      data: JSON.stringify({faceId1: face.id, faceId2: faceIds[face.gender]})
    })
  };

  sendFaceId(face).done(function (res) {
    console.log('verified', res);
    if (callback) callback(res);
  }).fail(failed);
}

function detect (url, callback) {
  var sendUrl = function (url) {
    return $.ajax({
      type: "POST",
      url: 'images/detect',
      contentType: "application/json",
      data: JSON.stringify({url: url})
    })
  };

  var uploadFile = function (file) {
    return $.ajax({
      type: "POST",
      url: 'images/detect',
      contentType: "application/octet-stream",
      data: file,
      processData: false
    })
  };

  (typeof url === 'string' && url.startsWith('http') ? sendUrl : uploadFile)(url).done(function (res) {
    console.log('detected', res);
    if (callback) callback(res);
  }).fail(failed);
}

function analyze (url, callback) {
  var sendUrl = function (url) {
    return $.ajax({
      type: "POST",
      url: 'images/analyze',
      contentType: "application/json",
      data: JSON.stringify({url: url})
    })
  };

  var uploadFile = function (file) {
    return $.ajax({
      type: "POST",
      url: 'images/analyze',
      contentType: "application/octet-stream",
      data: file,
      processData: false
    })
  };

  var done = function (analyzed) {
    // $('.attrs .response').text(JSON.stringify(analyzed, null, 2));
    $('.attrs .caption').text(analyzed.description.captions[0].text);
    if (!analyzed.faces.length) {
      drawNoFaceWorning();
      loading.hide();
      return;
    }

    detect(url, function (detected) {
      if (!detected.length) {
        drawNoFaceWorning();
        loading.hide();
        return;
      }

      loading.hide();
      fontSize = detected.length >= 3 ? 'small' : 'medium';
      $.each(detected, function () {
        var face = {id: this.faceId, faceRectangle: this.faceRectangle, age: this.faceAttributes.age, gender: this.faceAttributes.gender};
        verify(face, function (verified) {
          face.confidence = verified.confidence;
          drawFaceAttrs(face);
        });
      });
    });
    if (callback) callback(analyzed);
  };

  var key = normalizeKey(url);
  if (cache[key]) {
    var res = cache[key];
    console.log('analyzed(cache)', res);
    done(res);
    return;
  }

  loading.show();
  (typeof url === 'string' && url.startsWith('http') ? sendUrl : uploadFile)(url).done(function (res) {
    cache[key] = res;
    console.log('analyzed', res);
    done(res);
  }).fail(failed);
}

var loading = {
  show: function () {
    $('.canvas-outer').css('opacity', 0.5);
    $('.canvas-outer').find('img').show();
  },
  hide: function () {
    $('.canvas-outer').css('opacity', 1.0);
    $('.canvas-outer').find('img').hide();
  },
  css: function (attrs) {
    $('.canvas-outer').find('img').css(attrs);
  }
};

function fitCanvasSize () {
  var w = $('.canvas-outer').width();
  var h = $('.canvas-outer').height();
  $('canvas').attr('width', w);
  $('canvas').attr('height', h);
  loading.css({left: w/2 - 40, top: h/2 - 40});
}

function calculateAspectRatio(srcWidth, srcHeight, maxWidth, maxHeight) {
  return Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1.0);
}

function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
  var ratio = calculateAspectRatio(srcWidth, srcHeight, maxWidth, maxHeight)
  return { width: srcWidth*ratio, height: srcHeight*ratio };
}

function loadImage(src, callback) {
  var img = new Image();
  img.onload = function() {
    clearCanvas();
    drawImage(img);
    if (callback) callback(img);
  };
  img.src = src;
}

function readImage(file, callback) {
  var fileReader = new FileReader();
  fileReader.onload = function(e) {
    loadImage(e.target.result);
    if (callback) callback(e.target.result);
  };
  fileReader.readAsDataURL(file);
}

function readImageAsBinary(file, callback) {
  var fileReader = new FileReader();
  fileReader.onload = function(e) {
    callback(e.target.result);
  };
  fileReader.readAsArrayBuffer(file);
}

var ratio;
var offset;

function clearCanvas () {
  var canvas = $('canvas')[0];
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawImage (img) {
  var canvas = $('canvas')[0];
  var ctx = canvas.getContext('2d');
  ratio = calculateAspectRatio(img.width, img.height, canvas.width, canvas.height);
  var size = calculateAspectRatioFit(img.width, img.height, canvas.width, canvas.height);
  offset = {x: (canvas.width - size.width)/2, y: (canvas.height - size.height)/2};
  ctx.drawImage(img, offset.x, offset.y, size.width, size.height);
}

function drawNoFaceWorning () {
  var text = t['worning']['noFace'];
  var x = offset.x;
  var y = offset.y;
  var font = fontAttrs();
  var padding = font.margin;
  drawRoundedRect(x, y, measureTextWidth(text) + 2*padding, font.height + 2*padding, 3);
  drawText(text, x + padding, y + font.height + padding);
}

function drawFaceAttrs (face) {
  var faceRect = face.faceRectangle;
  var rect = {x: offset.x + faceRect.left*ratio, y: offset.y + faceRect.top*ratio, width: faceRect.width*ratio, height: faceRect.height*ratio}
  var margin = 10;
  drawRect(rect.x, rect.y, rect.width, rect.height);

  var text = ageAndGenderText(face);
  var textWidth = measureTextWidth(text);
  drawBalloon(text, rect.x + (rect.width - textWidth)/2, rect.y + rect.height + margin);
}

function measureTextWidth (text) {
  var canvas = $('canvas')[0];
  var ctx = canvas.getContext('2d');
  ctx.font = fontAttrs().style;
  return ctx.measureText(text).width;
}

function drawBalloon (text, x, y) {
  var font = fontAttrs();
  var padding = font.margin;
  var triangleWidth = 10;
  var textWidth = measureTextWidth(text);
  var leftOffset = textWidth * 0.4;
  drawTriangle(x + triangleWidth/2 + leftOffset - padding, y, triangleWidth);
  var radius = 3;
  drawRoundedRect(x - padding, y, textWidth + 2*padding, font.height + 2*padding, radius);
  drawText(text, x + padding - padding, y + font.height + padding);
}

var t = {
  worning: {
    noFace: '顔の検出数 0'
  },
  beautifulRank: {
    male: {
      high: 'イケメン',
      medium: '少しイケメン',
      normal: 'フツメン？',
      low: 'ノーコメント'
    },
    female: {
      high: '美人',
      medium: '少し美人',
      normal: '普通？',
      low: 'ノーコメント'
    }
  },
  age: '歳',
  boy: '男の子',
  girl: '女の子',
  man: '男性',
  woman: '女性'
};

var colors = {
  white: "rgba(255, 255, 255, 1.0)",
  red: "rgba(255, 0, 0, 1.0)",
  gray: "rgba(128, 128, 128, 0.5)",
  cyan: "rgba(0, 255, 255, 0.5)",
  magenta: "rgba(255, 0, 255, 0.5)",
  green: "rgba(0, 102, 0, 0.7)"
};

var fontSize = ['small', 'medium'][0];

function fontAttrs () {
  var height = 22;
  var weight = 'bold';
  var fillStyle = colors.white;
  var strokeStyle = colors.white;
  var lineWidth = 1.0;
  if (height < 20) {
    lineWidth = 0.5;
  } else if (height < 30) {
    lineWidth = 1.0;
  } else {
    lineWidth = 1.5;
  }

  weight = 'normal';
  lineWidth = 0;

  if (fontSize == 'small') {
    height = 12;
    weight = 'normal';
    fillStyle = colors.white;
    strokeStyle = colors.white;
    lineWidth = 0;
  }

  return {
    height: height,
    style: weight + ' ' + height + 'pt "メイリオ"',
    margin: height * 0.4,
    fillStyle: fillStyle,
    strokeStyle: strokeStyle,
    lineWidth: lineWidth
  };
}

var balloon = {
  color: colors.green
};

var border = {
  color: colors.green,
  width: 2
};

function drawTriangle(centerX, centerY, width) {
  var canvas = $('canvas')[0];
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(centerX + width/2, centerY);
  ctx.lineTo(centerX, centerY - width/2*1.5);
  ctx.lineTo(centerX - width/2, centerY);
  ctx.fillStyle = balloon.color;
  ctx.closePath();
  ctx.fill();
}

function ageAndGenderText(face) {
  var age = face.age;
  var gender = face.gender;
  if (gender.toLowerCase() == 'male') {
    if (face.confidence >= 0.3) {
      gender = t['beautifulRank']['male']['high'];
    } else {
      gender = age < 20 ? t['boy'] : t['man'];
    }
  } else {
    if (face.confidence >= 0.3) {
      gender = t['beautifulRank']['female']['high'];
    } else{
      gender = age < 20 ? t['girl'] : t['woman'];
    }
  }
  return Math.round(face.age) + t['age'] + ' ' + gender;
}

function drawRect (x, y, width, height) {
  var canvas = $('canvas')[0];
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.strokeStyle = border.color;
  ctx.lineWidth = border.width;
  ctx.stroke();
}

function drawRoundedRect (x, y, width, height, radius) {
  var radian = function (angle) {
    return angle * Math.PI / 180;
  };
  var left = x;
  var top = y;
  var canvas = $('canvas')[0];
  var ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(left + radius,         top + radius,          radius, radian(-180), radian(-90), false);
  ctx.arc(left + width - radius, top + radius,          radius, radian(-90),  radian(0),   false);
  ctx.arc(left + width - radius, top + height - radius, radius, radian(0),    radian(90),  false);
  ctx.arc(left + radius,         top + height - radius, radius, radian(90),   radian(180), false);
  ctx.fillStyle = balloon.color;
  ctx.closePath();
  ctx.fill();
}

function drawText (text, x, y) {
  var canvas = $('canvas')[0];
  var ctx = canvas.getContext('2d');
  var font = fontAttrs();

  ctx.beginPath();
  ctx.font = font.style;
//      if (options && options.strokeStyle) {
  ctx.fillStyle = font.fillStyle;
  ctx.fillText(text, x, y);
  ctx.fill();
  if (font.lineWidth > 0) {
    ctx.strokeStyle = font.strokeStyle;
    ctx.lineWidth = font.lineWidth;
    ctx.strokeText(text, x, y);
    ctx.stroke();
  }
//      } else {
//        ctx.fillStyle = fontAttrs().color;
//        ctx.fillText(text, x, y);
//        ctx.fill();
//      }
  ctx.closePath();
}

function validateFile(file) {
  if (file.type && !file.type.match('image.*')) { return false; }
  if (file.name && !file.name.match(/\.(gif|png|jpe?g)$/i)) { return false; }
  if (file.size && file.size > 5 * 1000 * 1000) { return false; } // 5MB
  return true;
}

var binaryToSrc = {};

function addFileInputHandler () {
  $('input[type="file"]').on('change', function () {
    if (!this.files.length) { return; }
    // loading.show();
    var file = this.files[0];
    if (!validateFile(file)) { return; }


    readImage(file, function (src) {
      appendImage(wall, src);
      focusFirstCell();
      readImageAsBinary(file, function (binary) {
        binaryToSrc[encode(binary)] = src;
        analyze(binary);
      });
    });
  });
}

function addSearchFileButtonClickHandler () {
  $('.search-file').on('click', function () {
    // loading.show();
    var text = $('input[type="text"]').val();
    if (text.match(/^http.+\.(gif|png|jpe?g)$/i)) {
      loadImage(text, function () {
        appendImage(wall, text);
        focusFirstCell();
        analyze(text)
      });
    }
  });
}

function addUploadFileButtonClickHandler () {
  $('.upload-btn').on('click', function () {
    $('input[type="file"]').trigger('click');
  });
}

function addImageClickHandler () {
  $('.cell').off('click');
  $('.cell').on('click', function() {
    if ($(this).hasClass('selected')) { return; }
    // loading.show();
    $('.cell').removeClass('selected');
    $('.cell').css('opacity', 0.5);
    var $clicked = $(this);
    $clicked.addClass('selected').css('opacity', 1.0);
    var url = $clicked.data('url');
    loadImage(url, function () { analyze(url) });
  });
}

function appendImage (wall, src) {
  var template = '<div class="cell" data-url="{url}" style="width: {width}px; height: {height}px; background-image: url({url}); background-size: contain; background-repeat: no-repeat; background-position: center center;"></div>';
  var width = 160, height = 160;
  var html = template
      .replace(/\{url\}/g, src)
      .replace(/\{width\}/g, width)
      .replace(/\{height\}/g, height);
  // $(".images").append(html);
  var $html = $($.parseHTML(html));
  wall.prepend($html);
  // $html.find("img.lazy").lazyload();
  addImageClickHandler();
}

function focusFirstCell () {
  $('.cell').removeClass('selected');
  $('.cell:first').addClass('selected');
  $('.cell').css('opacity', 0.5);
  $('.cell.selected').css('opacity', 1.0);
}

function clickFirstCell () {
  $('.cell:first').trigger('click');
}

function resetOpacity () {
  $('.cell:not(.selected)').css('opacity', 0.5);
  $('.cell.selected').css('opacity', 1.0);
}

var wall;
var cellWidth = 160, cellHeight = 160;