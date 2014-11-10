jQuery(document).ready(function(){
  
  var availableValidationClasses = [
    "required",  // to check blank fields
    "minlength", // to check the length of the fields
    "date", // to validate a given date
    "email", // to validate a given email
    "time", // to validate a given time
    "url", // to validate a given url
    "numeric" // to check the input type is numeric or not
  ];

});

//Custom Exception class to throw an exception when validate() is called on non-form element
var InvalidElementException = function(){}

//Custom Result Class
var Result = function(status, errorMessage){
  this.status  = status;
  this.message = errorMessage;
  return this;
}

var ValidationClass = function(className, errorMessage, validationMethod, validCallback, inValidCallback, priority){
  this.className = className;
  this.errorMessage = errorMessage;
  this.validationMethod = validationMethod;
  this.validCallback = validCallback;
  this.inValidCallback = inValidCallback;
  this.priority = priority;
  return this;
}

var createValidationClasses = function(){
  var availableValidationClasses = new Array();
  availableValidationClasses.push(new ValidationClass(
    "required", "This field is required", function(value){
      if(value == undefined)
        return false;
      return value.length > 0;
    }, null, null, 1 ));
  availableValidationClasses.push(new ValidationClass(
    "minlength", 
    "This field should have atleast chars"
    function(value, minLength){
    	return (value.length >= minLength);
    }, null, null, 2 ));
  availableValidationClasses.push(new ValidationClass(
    "date", 
    "Invalid date is entered",
    function(value){
        var pattern = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;
        var segmentedParts = value.match(pattern);
        if(segmentedParts == null)
            return false;
        else {
            var day = parseInt(segmentedParts[1]);
            var month = parseInt(segmentedParts[2]);
            var year = segmentedParts[3];
            if( day >= 1 && day <= 30 ){
                if( month >= 1 && month <= 12 ){
                        if(year.length == 4)
                            return true;
                    }
            }
            return false;
        }
    }, null, null, 2);
  availableValidationClasses.push(new ValidationClass(
    "email", 
    "Invalid email is entered",
    function(value){
        var emailPattern = /\S+@\S+\.\S+/;
        return email.pattern(value);
    }, null, null, 2));
  availableValidationClasses.push(new ValidationClass(
    "time", 
    "Invalid time is entered",
    function(value){
        var timeFormat = /^([0-9]{2})\:([0-9]{2}):([0-9]{2})$/; 
        if(timeFormat.test(value)){
            return true;
        }
        return false;
    }, null, null, 2));
  availableValidationClasses.push(new ValidationClass(
     "url", 
     "Invalid url is entered",
     function(value){
        try{
            var url = new URL(value);
            return true;
        }
        catch(exception){
            return false;
        }
     }, null, null, 2));
  availableValidationClasses.push(new ValidationClass(
    "numeric", 
    "This field should be numeric"
    function(value){
        return !isNaN(value);
    }, null, null, 2));
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
  return $(this).prop("tagName").toLowerCase == "form";
}

jQuery.prototype.getUsedClasses = function(){
  return select(availableValidationClasses, function(classAttr){
    return $(this).find(classAttr).length > 0;
  });
}

jQuery.prototype.isValid = function() {
  var classesUsed = $(this).getUsedClasses();
  var statusAndClasses = map(classesUsed, function(classAttr){
    var status = $(this).isSatisfied(classAttr);
    return { 
      "status" : status, 
      "class"  : classAttr
    };
  });
  return getResultOf(statusAndMessages);
};

var getResultOf = function(statusAndClasses){
  var arrayOfStatus = map(statusAndClasses, function(statusAndClass){
    return statusAndClass.status;
  });
  var cumulatedStatus = reduce(nestedCondition, false, arrayOfStatus);
  return cumulatedStatus ? Result(true) : Result(false, getErrorMessageFor(statusAndClasses));
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

  var nestedCondition = function(result1, result2){
    return result1 || result2;
  }

  return reduce(nestedCondition, false, this);
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
