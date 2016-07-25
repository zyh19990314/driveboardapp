


function fills_add_by_color(color) {
  var pathidx = jobhandler.vector.colors.indexOf(color)
  var path = jobhandler.vector.paths[pathidx]
  var bounds = jobhandler.stats.paths[pathidx].bbox
  var leadin = app_config_main.raster_leadin
  var min_x = Math.max(bounds[0]-leadin, 0)
  var max_x = Math.min(bounds[2]+leadin, app_config_main.workspace[0])
  var line_delta = app_config_main.raster_size
  var fillpolylines = []
  var lines = []
  for (var y = bounds[1]+0.001; y <= bounds[3]; y+=line_delta) {
    // for every fill line
    // intersect with all segments of path
    lines.push([[min_x,y],[max_x,y]])
    var intersections = []
    for (var i = 0; i < path.length; i++) {
      var polyline = path[i]
      if (polyline.length > 1) {
        pv = polyline[0]
        for (var j = 1; j < polyline.length; j++) {
          var v = polyline[j]
          res = fills_intersect(min_x, y, max_x, y, pv[0], pv[1], v[0], v[1])
          if (res.onSeg1 && res.onSeg2) {
            intersections.push([res.x, res.y])
          }
          pv = v
        }
      }
    }
    // sort intersection points by x
    intersections = intersections.sort(function(a, b) {
      return a[0] - b[0]
    })
    // generate cut path
    if (intersections.length > 1) {
      var pv = intersections[0]
      var y_i = intersections[0][1]
      fillpolylines.push([[min_x, y_i]])  // polyline of one
      for (var k = 1; k < intersections.length; k++) {
        var v = intersections[k]
        if ((k % 2) == 1) {
          fillpolylines.push([ [pv[0],pv[1]],[v[0],v[1]] ])  // polyline of two
        }
        pv = v
      }
      fillpolylines.push([[max_x, y_i]])    // polyline of one
    }
  }
  // add to jobhandler
  jobhandler.vector.paths.push(fillpolylines)
  // generate a new color shifted from the old
  var fillcolor = new paper.Color(color)
  while (true) {
    if (fillcolor.brightness > 0.5) {
      fillcolor.brightness -= 0.3
    } else {
      fillcolor.brightness += 0.3
    }
    fillcolor.hue += 10+5*Math.random()
    var col = fillcolor.toCSS(true)
    if (!(col in jobhandler.vector.colors)) {
      jobhandler.vector.colors.push(col)
      break
    }
  }


  // also make sure the feedrate and seekrate are equal

  // update pass widgets
  passes_clear()
  passes_set_assignments(jobhandler.vector.passes, jobhandler.vector.colors)
  jobhandler.render()
  jobhandler.draw()
}


function fills_intersect(Ax, Ay, Bx, By, Dx, Dy, Ex, Ey) {
    // intersect two line segments: A-B and D-E.
    // If the lines intersect, the result contains the x and y of the
    // intersection (treating the lines as infinite) and booleans for
    // whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onSeg1: false,
        onSeg2: false
    }
    denominator = ((Ey - Dy) * (Bx - Ax)) - ((Ex - Dx) * (By - Ay))
    if (denominator == 0) { return result }
    a = Ay - Dy
    b = Ax - Dx
    numerator1 = ((Ex - Dx) * a) - ((Ey - Dy) * b)
    numerator2 = ((Bx - Ax) * a) - ((By - Ay) * b)
    a = numerator1 / denominator
    b = numerator2 / denominator
    // ray intersection
    result.x = Ax + (a * (Bx - Ax))
    result.y = Ay + (a * (By - Ay))
    // if A-B is a segment and D-E is a ray, they intersect if:
    if (a > 0 && a < 1) {
        result.onSeg1 = true
    }
    // if D-E is a segment and A-B is a ray, they intersect if:
    if (b > 0 && b < 1) {
        result.onSeg2 = true
    }
    // if A-B and D-E are segments, they intersect if both are true
    return result
}
