
// Collision detection algorithm:
//    Time -- O(n)
//    Space -- O(l^3 + n) // l - num cubes per side

// Create binCube (fixed-depth octree) of certain tuned size

// map colliders to bins -- O(n)
//
// for non-static colliders -- O(n)
//    for 8 corners of collider AABB -- O(8)
//      map corner to bin
//      check for collision with all colliders in bin
//           -- worst case is O(n), but best is roughly O(1)
//           -- depends on tuning of binLength


// Physics engine interface
(function () {

  // Wrapper(s) for Cannon's Body object(s)
  function EntityBody() {
    // TODO
  }


}) ();
