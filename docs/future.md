Title: Future
Description: Stuff to purse in HappyFunTimes

These would be very nice to have. I don't know if or when I'll have time to
implement them. Feel free to implement them yourself and submit a pull request
or pick one of the other 1000+ things [to do](../todo.md).

### Simpler controller creation

Making controllers in JavaScript can be frustrating. One idea is to make
that easy is to use some kind of structured drawing program like InkScape
or Powerpoint or even Google Docs Presentation so design a controller.
Export it to SVG, then run some tool on it that generates the controller or
use the SVG directly in the controller.

The idea is somehow you'd label different areas as buttons, sliders, dpads, whatever
with ids and there'd be some higher level API that would just automatically emit
messages inside Unity based on those ids and or keep track of their state "pressed",
"not pressed", etc.

It would make some things easier but at the possible expensive of flexibility.

One issue is I don't know of any structured drawing programs that let you
set ids or other metadata on shapes so some other creative ideas would be needed
like using text boxes in groups to label things or something.

For now, copying an existing controller from another game and modifying it is
probably the way to go

### Using Canvas to draw the contollers

One of the biggest issues with controllers is they're written in HTML5 using
HTML5 elements. Those elements get shifted around in different ways with CSS
and various browsers, phones, etc.

Drawing them in a canvas would make it very easy to just scale the drawing or
scale the canvas removing most of those issues.

Another issue is unlike a native app the browser can not pick an orientation.
That means if the contoller is landscape and phone is portrait the controller
will just show up funny. Up to now I've worked around this by using CSS
to show a "Turn the phone" msg when held in the wrong orientation for the game.
Unfortunately many people have their phone locked and so they rotate their phone
and nothing happens. Some of them realize they have to unlock the orientation
but if I switched to rendering in a canvas I could just detect the orientation
and render rotated 90 degrees and that problem would be solved. No need to unlock.

Unfortunately, there are drawbacks as well. HTML5 defines lots of styling, and
other features what would all have to be hand drawn if done in canvas.
