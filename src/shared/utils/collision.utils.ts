/**
 * Collision detection utilities
 */

/**
 * Checks if two rectangles intersect
 */
export const rectIntersect = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

/**
 * Checks if two circles intersect
 */
export const circleIntersect = (
  circle1: { x: number; y: number; radius: number },
  circle2: { x: number; y: number; radius: number }
): boolean => {
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < circle1.radius + circle2.radius;
};

/**
 * Checks if a point is inside a rectangle
 */
export const pointInRect = (
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

/**
 * Checks if a point is inside a circle
 */
export const pointInCircle = (
  point: { x: number; y: number },
  circle: { x: number; y: number; radius: number }
): boolean => {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
};

/**
 * Checks if a circle intersects with a rectangle
 */
export const circleRectIntersect = (
  circle: { x: number; y: number; radius: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean => {
  // Find the closest point on the rectangle to the circle center
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  
  // Calculate distance from circle center to closest point
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  
  return dx * dx + dy * dy <= circle.radius * circle.radius;
};