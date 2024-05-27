/*!
 * Copyright 2024 Cognite AS
 */

import { type Vector3, type Ray } from 'three';
import { replaceLast } from '../utilities/extensions/arrayExtensions';
import { type AnyIntersection, CDF_TO_VIEWER_TRANSFORMATION } from '@cognite/reveal';
import { type DomainObject } from '../domainObjects/DomainObject';

/**
 * Helper class for create a domain object by clicking around
 */
export abstract class BaseCreator {
  // ==================================================
  // INSTANCE FIELDS
  // ==================================================

  private readonly _points: Vector3[] = []; // Clicked points
  private _lastIsPending: boolean = false; // If true, the last point is hover and not confirmed.

  // ==================================================
  // INSTANCE PROPERTIES
  // ==================================================

  protected get points(): Vector3[] {
    return this._points;
  }

  protected get pointCount(): number {
    return this.points.length;
  }

  protected get notPendingPointCount(): number {
    return this.lastIsPending ? this.pointCount - 1 : this.pointCount;
  }

  protected get firstPoint(): Vector3 {
    return this.points[0];
  }

  protected get lastPoint(): Vector3 {
    return this.points[this.pointCount - 1];
  }

  protected get lastNotPendingPoint(): Vector3 {
    return this.points[this.notPendingPointCount - 1];
  }

  protected get lastIsPending(): boolean {
    return this._lastIsPending;
  }

  // ==================================================
  // VIRTUAL METHODS
  // ==================================================

  /**
   * Gets the value indicating whether to prefer intersection with somthing.
   * If this is true, it will first try to intersect an object. If false the point
   * will normally be calculatd based on the previous point and the ray in addPointCore
   *
   * @returns {boolean} The value indicating whether to prefer intersection.
   */
  public get preferIntersection(): boolean {
    return false;
  }

  public abstract get domainObject(): DomainObject;

  /**
   * @returns The minimum required points to create the domain object.
   */
  protected abstract get minimumPointCount(): number;

  /**
   * @returns The maximim required points to create the domain object.
   */

  protected abstract get maximumPointCount(): number;
  /**
   * Adds a new point
   * @param ray - The ray the camera has (in Cdf coordinates)
   * @param point - The point to add.(in Cdf coordinates). If undefined, it indicates that
   * it wasn't intersection anything. Then then ray and the previous point can be used to calculate the point.
   * @param isPending - Indicates whether the point is pending (hover over instead of clicking).
   * @returns A boolean value indicating whether the point was successfully added.
   */
  protected abstract addPointCore(
    ray: Ray,
    point: Vector3 | undefined,
    isPending: boolean
  ): boolean;

  /**
   * Handles the escape key press event.
   *
   * @returns {boolean} Returns true if the pending object is created successfully, false if it is removed
   */
  public handleEscape(): boolean {
    return false;
  }

  // ==================================================
  // INSTANCE METHODS
  // ==================================================

  public get isFinished(): boolean {
    return this.notPendingPointCount >= this.maximumPointCount;
  }

  public addPoint(
    ray: Ray,
    intersection: AnyIntersection | undefined,
    isPending: boolean = false
  ): boolean {
    const point = intersection?.point.clone();
    this.convertToCdfCoords(ray, point);
    return this.addPointCore(ray, point, isPending);
  }

  protected addRawPoint(point: Vector3, isPending: boolean): void {
    if (this.lastIsPending) {
      replaceLast(this.points, point);
    } else {
      this.points.push(point);
    }
    this._lastIsPending = isPending;
  }

  protected removePendingPoint(): void {
    if (this.lastIsPending) {
      this.points.pop();
      this._lastIsPending = false;
    }
  }

  private convertToCdfCoords(ray: Ray, point: Vector3 | undefined): void {
    const matrix = CDF_TO_VIEWER_TRANSFORMATION.clone().invert();
    ray.applyMatrix4(matrix);
    if (point !== undefined) {
      point.applyMatrix4(matrix);
    }
  }
}
