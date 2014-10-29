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
var invalidElementException = function(){}

jQuery.prototype.validate = function(){
  if ( $(this).isForm() ){
    classesUsed = $(this).getUsedClasses();
    inputFields = getInputFieldsFor(classesUsed);
    validateEach(inputFields);
  }
  else{
    throw new invalidElementException();
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
    result.push(arrayElement);
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