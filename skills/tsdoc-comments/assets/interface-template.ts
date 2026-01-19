/**
 * Brief description of what this interface represents
 * 
 * @public
 */
interface InterfaceName {
  /**
   * Description of this property
   * Include valid values, ranges, or constraints
   */
  propertyName: string;

  /**
   * Optional property description
   * @defaultValue Default value if any
   */
  optionalProperty?: number;

  /**
   * Description of this method
   * 
   * @param param - Parameter description
   * @returns Return value description
   */
  methodName(param: string): ReturnType;
}

/**
 * Type alias with detailed documentation
 * 
 * @remarks
 * Explain when to use this type and any important constraints.
 */
type CustomType = string | number;
