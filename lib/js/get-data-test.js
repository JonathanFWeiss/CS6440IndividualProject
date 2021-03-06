//adapted from the cerner smart on fhir guide. updated to utalize client.js v2 library and FHIR R4

//create a fhir client based on the sandbox enviroment and test paitnet.
const client = new FHIR.client({
  serverUrl: "https://r3.smarthealthit.org",
  tokenResponse: {
    // patient: "a6889c6d-6915-4fac-9d2f-fc6c42b3a82e"
    patient:"c4d86d0c-cb08-4d85-ab5a-9825fa0938b8"

    //Patient browser https://patient-browser.smarthealthit.org/index.html?config=r3-open-sandbox#/

  }
});

// helper function to process fhir resource to get the patient name.
function getPatientName(pt) {
  if (pt.name) {
    var names = pt.name.map(function(name) {
      return name.given.join(" ") + " " + name.family;
    });
    return names.join(" / ")
  } else {
    return "anonymous";
  }
}

// display the patient name gender and dob in the index page
function displayPatient(pt) {
  document.getElementById('patient_name').innerHTML = getPatientName(pt);
  document.getElementById('gender').innerHTML = pt.gender;
  document.getElementById('dob').innerHTML = pt.birthDate;
}

//function to display list of medications
function displayMedication(meds) {
  med_list.innerHTML += "<li> " + meds + "</li>";
}

//helper function to get quanity and unit from an observation resoruce.
function getQuantityValueAndUnit(ob) {
  if (typeof ob != 'undefined' &&
    typeof ob.valueQuantity != 'undefined' &&
    typeof ob.valueQuantity.value != 'undefined' &&
    typeof ob.valueQuantity.unit != 'undefined') {
    return Number(parseFloat((ob.valueQuantity.value)).toFixed(2)) + ' ' + ob.valueQuantity.unit;
  } else {
    return undefined;
  }
}

// helper function to get both systolic and diastolic bp
function getBloodPressureValue(BPObservations, typeOfPressure) {
  var formattedBPObservations = [];
  BPObservations.forEach(function(observation) {
    var BP = observation.component.find(function(component) {
      return component.code.coding.find(function(coding) {
        return coding.code == typeOfPressure;
      });
    });
    if (BP) {
      observation.valueQuantity = BP.valueQuantity;
      formattedBPObservations.push(observation);
    }
  });

  return getQuantityValueAndUnit(formattedBPObservations[0]);
}

// create a patient object to initalize the patient
function defaultPatient() {
  return {
    height: {
      value: ''
    },
    weight: {
      value: ''
    },
    sys: {
      value: ''
    },
    dia: {
      value: ''
    },
    ldl: {
      value: ''
    },
    hdl: {
      value: ''
    },
    note: 'No Annotation',
  };
}

//helper function to display the annotation on the index page
function displayAnnotation(annotation) {
  note.innerHTML = annotation;
}

//function to display the observation values you will need to update this
function displayObservation(obs) {
  hdl.innerHTML = obs.hdl;
  ldl.innerHTML = obs.ldl;
  sys.innerHTML = obs.sys;
  dia.innerHTML = obs.dia;
  height.innerHTML = obs.height;
  weight.innerHTML = obs.weight;
}

// get patient object and then display its demographics info in the banner
client.request(`Patient/${client.patient.id}`).then(
  function(patient) {
    displayPatient(patient);
    console.log(patient);
  }
);

// get observation resoruce values
// you will need to update the below to retrive the weight and height values
var query = new URLSearchParams();

  query.set("patient", client.patient.id);
  query.set("_count", 100);
  query.set("_sort", "-date");
  query.set("code", [
    'http://loinc.org|8462-4',
    'http://loinc.org|8480-6',
    'http://loinc.org|2085-9',
    'http://loinc.org|2089-1',
    'http://loinc.org|55284-4',
    'http://loinc.org|3141-9',
    'http://loinc.org|8302-2',
    'http://loinc.org|29463-7',
  ].join(","));


var medResults = ["SAMPLE Lasix 40mg","SAMPLE Naproxen sodium 220 MG Oral Tablet","SAMPLE Amoxicillin 250 MG"]


client.request("Observation?" + query, {
  pageLimit: 0,
  flat: true
}).then(
  function(ob) {

    // group all of the observation resoruces by type into their own
    var byCodes = client.byCodes(ob, 'code');
    var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
    var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
    var hdl = byCodes('2085-9');
    var ldl = byCodes('2089-1');
    
    var height = byCodes('8302-2');
    var weight = byCodes('29463-7');//3141 doesn't work.
    console.log(weight[0])
    

    // create patient object
    var p = defaultPatient();

    // set patient value parameters to the data pulled from the observation resoruce
    if (typeof systolicbp != 'undefined') {
      p.sys = systolicbp;
    } else {
      p.sys = 'undefined'
    }

    if (typeof diastolicbp != 'undefined') {
      p.dia = diastolicbp;
    } else {
      p.dia = 'undefined'
    }

    p.hdl = getQuantityValueAndUnit(hdl[0]);
    p.ldl = getQuantityValueAndUnit(ldl[0]);
    p.height = getQuantityValueAndUnit(height[0]);
    p.weight = getQuantityValueAndUnit(weight[0]);

    displayObservation(p)

  });


var query2 = new URLSearchParams();

  query2.set("patient", client.patient.id);
  query2.set("_count", 100);
  query2.set("_sort", "-date");


// client.request("MedicationRequest?" + query2, {
  client.request("DiagnosticReport?" + query2, {
  pageLimit: 0,
  flat: true
}).then(
  function(medResults) {

medResults.forEach(function(med) {
  // displayMedication(med.medicationCodeableConcept.text);
   //displayMedication("id: " + "https://r3.smarthealthit.org/DiagnosticReport/" + med.id);
   link = "https://r3.smarthealthit.org/DiagnosticReport/" + med.id;
  displayMedication("<a href="+link+">Exam Link</a>")

   test  = med.code.coding.pop()
  displayMedication(test.display+ ", Loinc Code: "+ test.code);
  //displayMedication(test.code);
 // displayMedication(med.code.coding.pop().code);


  displayMedication("Status: " + med.status);
  // displayMedication("category: " + med.category);
  displayMedication(" ");
  if (test.display == "MR Lumbar spine WO contrast"){displayMedication("<button class=\"open-button\" onclick=\"openForm()\">Low Back Pain MRI Assessment</button>")}

  if (test.display == "Basic Metabolic Panel"){displayMedication("<button class=\"open-button\" onclick=\"openForm_CAD()\">Coronary Artery Disease Assessment</button>")}

  if (test.display == "CT Coronary Calcium"){displayMedication("<button class=\"open-button\" onclick=\"openForm_CAD()\">Coronary Artery Disease Assessment</button>")}



  if (test.display == "CTA Coronary Arteries"){displayMedication("<button class=\"open-button\" onclick=\"openForm_CAD()\">Coronary Artery Disease Assessment</button>")}


  if (test.display == "Complete blood count (hemogram) panel - Blood by Automated count"){displayMedication("<button class=\"open-button\" onclick=\"openForm_IE()\">Infective Endocarditis Assessment</button>")}


  if (test.display == "U.S. standard certificate of death - 2003 revision"){displayMedication("<button class=\"open-button\" onclick=\"openForm_AHW()\">Acute Hand and Wrist Trauma Assessment</button>")}


  if (test.display == "Lipid Panel"){displayMedication("<button class=\"open-button\" onclick=\"openForm_CC()\">Colorectal Cancer Assessment</button>")}


  if (test.display == "Lipid Panel"){displayMedication("<button class=\"open-button\" onclick=\"openForm_S()\">Syncope Assessment</button>")}


  if (test.display == "Lipid Panel"){displayMedication("<button class=\"open-button\" onclick=\"openForm_D()\">Dysphagia Assessment</button>")}


  if (test.display == "Lipid Panel"){displayMedication("<button class=\"open-button\" onclick=\"openForm_IE()\">Infective Endocarditis Assessment</button>")}


  if (test.display == "Lipid Panel"){displayMedication("<button class=\"open-button\" onclick=\"openForm_CD()\">Crohn Disease</button>")}


  if (test.display == "Lipid Panel"){displayMedication("<button class=\"open-button\" onclick=\"openForm_M()\">Myelopathy</button>")}


  if (test.display == "Lipid Panel"){displayMedication("<button class=\"open-button\" onclick=\"openForm()\">Low Back Pain MRI Assessment</button>")}

  if (test.display == "Lipid Panel"){displayMedication("<button class=\"open-button\" onclick=\"openForm_CLD()\">Chronic Liver Disease Assessment</button>")}

  if (test.display == "Lipid Panel"){displayMedication("<button class=\"open-button\" onclick=\"openForm_AHW()\">Acute Hand and Wrist Trauma Assessment</button>")}

  if (test.display == "X-ray barium enema double-contrast"){displayMedication("<button class=\"open-button\" onclick=\"openForm_CC()\">Colorectal Cancer Assessment</button>")}


  if (test.display == "CT Heart Function and Morphology"){displayMedication("<button class=\"open-button\" onclick=\"openForm_S()\">Syncope Assessment</button>")}


  if (test.display == "CT neck and chest without IV contrast"){displayMedication("<button class=\"open-button\" onclick=\"openForm_D()\">Dysphagia Assessment</button>")}


  if (test.display == "Arteriography Coronary"){displayMedication("<button class=\"open-button\" onclick=\"openForm_IE()\">Infective Endocarditis Assessment</button>")}


  if (test.display == "MR Enterography"){displayMedication("<button class=\"open-button\" onclick=\"openForm_CD()\">Crohn Disease</button>")}


  if (test.display == "MRI Spine"){displayMedication("<button class=\"open-button\" onclick=\"openForm_M()\">Myelopathy</button>")}


  if (test.display == "MRI Spine"){displayMedication("<button class=\"open-button\" onclick=\"openForm()\">Low Back Pain MRI Assessment</button>")}

  if (test.display == "CT Abdomen"){displayMedication("<button class=\"open-button\" onclick=\"openForm_CLD()\">Chronic Liver Disease Assessment</button>")}

  if (test.display == "MRI Hand"){displayMedication("<button class=\"open-button\" onclick=\"openForm_AHW()\">Acute Hand and Wrist Trauma Assessment</button>")}



});
    
  });
  



// dummy data for medrequests

// get medication request resources this will need to be updated
// the goal is to pull all the medication requests and display it in the app. It can be both active and stopped medications


//update function to take in text input from the app and add the note for the latest weight observation annotation
//you should include text and the author can be set to anything of your choice. keep in mind that this data will
// be posted to a public sandbox
function addWeightAnnotation() {
  var annotation = "test annotation"
  displayAnnotation(annotation);

}

//event listner when the add button is clicked to call the function that will add the note to the weight observation
document.getElementById('add').addEventListener('click', addWeightAnnotation);
