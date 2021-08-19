var availableValidationClasses = [
  "required",  // to check blank fields
  "minlength", // to check the length of the fields
  "date", // to validate a given date
  "email", // to validate a given email
  "time", // to validate a given time
  "url", // to validate a given url
  "numeric" // to check the input type is numeric or not
];

var validationInstances = new Array();

//Custom exception class to throw an exception when validate() is called on non-form element
var InvalidElementException = function(){
  this.message = "Invalid element";
  return this;
}

//Custom Result Class
var Result = function(status, errorMessage){
  this.status  = status;
  this.message = errorMessage;
  return this;
}

//Custom class for Validation
var ValidationClass = function(className, errorMessage, validationMethod, validCallback, inValidCallback, priority){
  this.className = className;
  this.errorMessage = errorMessage;
  this.validationMethod = validationMethod;
  this.priority = priority;
  return this;
}

//Creating Instances
var createValidationClasses = function(){

  // Definition for 'Required' validation.
  validationInstances.push(new ValidationClass(
    "required", 
    function(jQueryElement){
      return "This field is required";
    }, 
    function( element ){
      var value = $(element).val();
      if ( value == undefined )
        return false;
      return value.length > 0;
    }, 1 ));

  // Definition for 'minLength' validation.
  validationInstances.push(new ValidationClass(
    "minlength", 
    function(jQueryElement){
      var minChars = $(jQueryElement).data("minLength");
      return "This field must have " + minChars + " characters" ;
    }, 
    function( element, minLength ){
      var value = $(element).val();
    	return ( value.length >= minLength );
    }, 2 ));

  // Definition for 'Date' validation.
  validationInstances.push(new ValidationClass(
    "date", 
    function(jQueryElement){
      return "Date is Invalid";
    },
    function( element ){
      var value = $(element).val();
      var slashPattern = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;
      var hyfendPattern = /^([0-9]{2})\-([0-9]{2})\-([0-9]{4})$/;
      var segmentedParts = value.match(slashPattern) == null ? value.match(hyfendPattern) : value.match(slashPattern) ;
      if(segmentedParts == null)
        return false;
      else{
        var day = parseInt( segmentedParts[1] );
        var month = parseInt( segmentedParts[2] );
        var year = segmentedParts[3];
        if ( day >= 1 && day <= 30 ){
          if ( month >= 1 && month <= 12 ){
            if (year.length == 4)
              return true;
          }
        }
        return false;
      }
    }, 2));

  // Definition for 'Email' validation.
  validationInstances.push(new ValidationClass(
    "email", 
    function(jQueryElement){
      return "Email is invalid";
    }, 
    function( element ){
      var value = $(element).val();
      var emailPattern = /\S+@\S+\.\S+/;
      return emailPattern.test(value);
    }, 2));

  // Definition for 'Time' validation.
  validationInstances.push(new ValidationClass(
    "time", 
    function(jQueryElement){
      return "Time is Invalid";
    },
    function( element ){
      var value = $(element).val();
      var timeFormat = /^([0-9]{2})\:([0-9]{2}):([0-9]{2})$/; 
      if(timeFormat.test(value)){
          return true;
      }
      return false;
    }, 2));

  // Definition for 'URL' validation.
  validationInstances.push(new ValidationClass(
    "url", 
    function(jQueryElement){
      return "URL is Invalid";
    },
    function( element ){
      var value = $(element).val();
      try{
        var url = new URL(value);
        return true;
      }
      catch(exception){
        return false;
      }
    }, 2));

  // Definition for 'Numeric' validation.
  validationInstances.push(new ValidationClass(
    "numeric", 
    function(jQueryElement){
      return "This field should be numeric";
    },
    function( element ){
      var value = $(element).val();
      return !isNaN(value);
    }, 2));
}

jQuery.prototype.validate = function(){
  if ( $(this).isForm() ){
    var classesUsed = $(this).getUsedClasses();
    var inputFields = getInputFieldsFor(classesUsed);
    validateEach(inputFields);
  }
  else{
    throw new InvalidElementException();
  }
}

jQuery.prototype.isForm = function() {
  return $(this).prop("tagName").toLowerCase() == "form";
}

jQuery.prototype.getUsedClasses = function(){
  var currentElement = $(this);
  return select(availableValidationClasses, function(classAttr){
    return currentElement.hasClass(classAttr);
  });
}

jQuery.prototype.isValid = function() {
  var currentElement = $(this);
  var classesUsed = currentElement.getUsedClasses();
  var resultCollection = map(classesUsed, function(validationClass){
    var status = currentElement.isSatisfied(validationClass);
    return { 
      "status" : status, 
      "class"  : validationClass
    };
  });
  return currentElement.getCumulatedValidationResultOf(resultCollection);
};

jQuery.prototype.isSatisfied = function(className){
  var validationInstance = findValidationInstanceFor(className);
  var currentElement = $(this);
  return validationInstance.validationMethod(currentElement);
}

jQuery.prototype.getCumulatedValidationResultOf = function(resultCollection){
  var arrayOfStatus = map(resultCollection, function(validationResult){
    return validationResult.status;
  });
  var cumulatedStatus = reduce(ANDCondition, true, arrayOfStatus);
  var resultSet = cumulatedStatus ? new Result(true) : new Result(false, getErrorMessageFor($(this), resultCollection));
  return resultSet; 
}

var getErrorMessageFor = function(jQueryElement, resultCollection){
  var erroredResultCollection = select(resultCollection, function(result){
    return !result.status;
  });
  var erroredValidationClassCollection = map(erroredResultCollection, function(erroredResult){
    return erroredResult.class;
  });
  var erroredValidationInstances = map(erroredValidationClassCollection, function(erroredValidationClass){
    return findValidationInstanceFor(erroredValidationClass);
  });
  if(erroredValidationInstances == null || erroredValidationInstances.isEmpty())
      return null;
  return erroredValidationInstances.first().errorMessage(jQueryElement);
}

var findValidationInstanceFor = function(className){
  var instanceToReturn;
  forEach(validationInstances, function(validationInstance){
    if ( validationInstance.className == className )
      instanceToReturn = validationInstance;
  });
  return instanceToReturn;
}

var validateEach = function(inputFields){
  forEach(inputFields, function(inputField){
    result = $(inputField).isValid();
    result.status ? $(inputField).triggerValidCallback() : $(inputField).triggerInvalidCallback(result.message);
  });
}

Object.prototype.isArray = function(){
  return this instanceof Array;
}

Array.prototype.isNested = function(){
  
  var results = map(this, function(arrayElement){
    arrayElement.isArray();
  });

  return reduce(ORCondition, false, this);
}

Array.prototype.isEmpty = function(){
  return this.length == 0 ;
}

Array.prototype.first = function(){
  return this[0];
}

var ORCondition = function(result1, result2){
  return result1 || result2;
}

var ANDCondition = function(result1, result2){
  return result1 && result2;
}

var getInputFieldsFor = function(classAttributes){
  var inputFields = map(classAttributes, function(classAttribute){
    return $( "." + classAttribute);
  });
  return flatten(inputFields);
}

var forEach = function(array, action){
  for(var i = 0; i < array.length ; i++ ){
    action(array[i]);
  }
}

var select = function(array, action){
  var result = new Array();
  forEach(array, function(arrayElement){
    if(action(arrayElement))
      result.push(arrayElement);
  });
  return result;
}

var map = function(array, action){
  var result = new Array();
  forEach(array, function(arrayElement){
    result.push(action(arrayElement));
  });
  return result;
}

var reduce = function(action, base, array){
  forEach(array, function(element){
    base = action(base, element);
  });
  return base;
}

var flatten = function(array, result){
  result = result || new Array();

  flattenedArray = result.concat.apply(result, array);
  if(array.isNested()){
    result = flatten(flattenedArray, result);
  }

  return result;
}
 
