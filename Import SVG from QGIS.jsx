/**********************************************************

Copyright : Arthur Bazin - 2024
Version : 1.0

Import layers from QGIS SVG Export

The QGIS Export need to have the "Export map layers as SVG Groups" ("Exporter les couches de la carte comme des groupes SVG" in french) option checked
Data will be in a layer named "QGIS" organized by map, then by layer
The layer order is kept (but that's not guarantee)

The size of points symbols and stokes are the same as defined in QGIS if in point or millimeters but not if in pixel (don't know why...)

*********************************************************/



/********************************************************
Core functionnality
********************************************************/

try {

	// Document have to be open
	if (app.documents.length == 0 ) {
		throw new Error('No open document.');
	}

	// Get the active document
	var activeDocument = app.activeDocument;

	// Get the SVG file
	qgisSVGData = File.openDialog('Please select the QGIS exported SVG file to import');

	// Ask for some options
	// The ok button will execute the main code
	dialogResult = openDialog();

	if (dialogResult) {
		main(dialogResult);
	}

}
catch(e) {
	alert(e.message, "Error in the script", true);
}






/********************************************************
Usefull functions
********************************************************/


function main(dialogResult){

	// Add a QGIS layer
	qgisLayer = activeDocument.layers.add();
	qgisLayer.name = "QGIS";

	// Import qgis data from the exported svg
	qgisLayersGroup = qgisLayer.groupItems.createFromFile(qgisSVGData);

	// Renaming the imported group
	qgisLayersGroup.name = "Other imported data";

	// Positionning the imported group
	qgisLayersGroup.position = [0, 0];



	/* Structure of the qgis layers when imported into a layer named "QGIS"
	QGIS
		unnamed group
			mapName: layer1Name
				unnamed group
					data
				unnamed group
					background
				unnamed group (many of them)
					empty
			mapName: layer2Name
				...
			Page
				some groups with background and other things
	*/

	// Remove every empty layers and groups
	cleanEmptyElement(qgisLayersGroup);

	cleanEmptyBlackorWhiteElement(qgisLayersGroup, dialogResult);

	// Loop on each QGIS Layer (from the last to the first)
	// Loop from the last to the first because when you move a layer, the list change and thus the indexes and the length too
	for(
		var i = qgisLayersGroup.groupItems.length-1; 
		i >= 0; 
		i--
	) {
		qgisLayerGroup = qgisLayersGroup.groupItems[i];

		// Remove intermediate subgroup and put the objects into the layer group
		movePathsToBaseGroup(qgisLayerGroup);
		// Reorganize label layers
		organizeLabelLayers(qgisLayerGroup);
		// Organize layer groups into map groups (instead of a list of all layer from all maps)
		organizeMapLayers(qgisLayerGroup, qgisLayer);
	}
}



function openDialog() {
	var returnValue = null;

	var win = new Window ("dialog", "Removing unwanted background objets");

	var wMain = win.add ("group");
	wMain.orientation = "column";
	wMain.alignChildren = "left";
	var rBW = wMain.add ("radiobutton", undefined, "Remove black & white filled backgrounds with no stroke");
	var rB = wMain.add ("radiobutton", undefined, "Remove black filled backgrounds with no stroke");
	var rW = wMain.add ("radiobutton", undefined, "Remove white filled backgrounds with no stroke");
	var rA = wMain.add ("radiobutton", undefined, "Keep all background objects");
	rBW.value = true;
	
	var wButtons = win.add ("group");
	wButtons.orientation = "row";
	wButtons.alignChildren = "center";
	okButton = wButtons.add ("button", undefined, "OK", {name: "ok"});
	cancelButton = wButtons.add ("button", undefined, "Cancel", {name: "cancel"});

	okButton.onClick = function () {
		win.close ();
		if (rBW.value == true) {
			returnValue = "rBW";
		}
		else if (rB.value == true) {
			returnValue = "rB";
		}
		else if (rW.value == true) {
			returnValue = "rW";
		}
		else if (rA.value == true) {
			returnValue = "rA";
		}
		else {
			returnValue = null;
		}
	}
	cancelButton.onClick = function () {
		win.close ();
		returnValue = null;
	}

	win.show ();
	return returnValue;
}



function cleanEmptyElement(element){

	// Clean transparent path
	for (
		var i = element.pathItems.length-1; 
		i >= 0; 
		i--
	) {
		var curPath = element.pathItems[i];

		if ( 
			(
				!curPath.stroked 
				&& !curPath.filled
			)
		) {
			curPath.remove();
		}
	}

	// For each subgroup
	for(
		var i = element.groupItems.length-1; 
		i >= 0; 
		i--
	) {
		if (
			element.groupItems[i].groupItems.length == 0
			&& element.groupItems[i].pathItems.length == 0
			&& element.groupItems[i].compoundPathItems.length == 0
			&& element.groupItems[i].textFrames.length == 0
		) {
			// Remove it if empty
			element.groupItems[i].remove();
		}
		else if (
			element.groupItems[i].groupItems.length > 0
			|| element.groupItems[i].pathItems.length > 0
			|| element.groupItems[i].compoundPathItems.length > 0
		) {
			// Reload function on subgroup(s)
			cleanEmptyElement(element.groupItems[i]);
		}
	};

}



function cleanEmptyBlackorWhiteElement(element, dialogResult){

	// For each subgroup
	for(
		var i = element.groupItems.length-1; 
		i >= 0; 
		i--
	) {

		selectedGroup = element.groupItems[i].groupItems[element.groupItems[i].groupItems.length-1]

		if (
			selectedGroup.pathItems.length == 1
			&& !selectedGroup.pathItems[0].stroked
			&& (
				(
					(dialogResult == "rBW" || dialogResult == "rB")
					&& selectedGroup.pathItems[0].fillColor.red == 0
					&& selectedGroup.pathItems[0].fillColor.green == 0
					&& selectedGroup.pathItems[0].fillColor.blue == 0
				)
				|| (
					(dialogResult == "rBW" || dialogResult == "rW")
					&& selectedGroup.pathItems[0].fillColor.red == 255
					&& selectedGroup.pathItems[0].fillColor.green == 255
					&& selectedGroup.pathItems[0].fillColor.blue == 255
				)
			) 
		) {

			// Remove the undesired object
			selectedGroup.pathItems[0].remove();
		}
	};

}



function movePathsToBaseGroup(element){
	if (
		element.groupItems.length > 0
		&& element.groupItems[0].groupItems.length == 0 
		&& element.groupItems[0].pathItems.length >= 1
		&& !element.name.match(/.+ \(Labels\)$/)
	) {
		for (
			var i = element.groupItems[0].pathItems.length-1; 
			i >= 0; 
			i--
		) {
			// Move paths to the base group and thus remove the intermediate subgroup
			var curPath = element.groupItems[0].pathItems[i];
			curPath.move(element, ElementPlacement.PLACEATEND);
		}
	}
}



function organizeLabelLayers(element){

	/*
	Warning /!\
	One ghost groups seems to appear, I don't know why
	=> Thats why we refere to the last groups as length-2 instead of length-1
	It seems that the index structure of the groups isn't updated immediatly thus the index number need to consider that
	=> Thas why the renamming done after the reorganization use length-2 instead of index 1 (second position)
	*/

	if (element.name.match(/.+ \(Labels\)$/)) {
		// Text objects + callouts
		if (
			element.groupItems[0].textFrames.length > 0
			&& element.groupItems[element.groupItems.length-2].textFrames.length == 0
			&& element.groupItems[element.groupItems.length-2].pathItems.length > 0
		) {
			// Move each element of each subgroup to the parent group
			for (
				var i = element.groupItems.length-1; 
				i >= 1; 
				i--
			) {
				for (
					var j = element.groupItems[i].textFrames.length-1; 
					j >= 0; 
					j--
				) {
					// Move paths to the base group and thus remove the intermediate subgroup
					var curPath = element.groupItems[i].textFrames[j];
					curPath.move(element.groupItems[0], ElementPlacement.PLACEATEND);
				}
			}

			// Rename layers
			element.groupItems[0].name = "Text";
			element.groupItems[element.groupItems.length-2].name = "Callouts";
		}
		// Only text objects
		else if (
			element.groupItems[0].textFrames.length > 0
			&& element.groupItems[element.groupItems.length-2].textFrames.length > 0
			&& element.groupItems[element.groupItems.length-2].pathItems.length == 0
		) {
			// Move each element of each subgroup to the parent group
			for (
				var i = element.groupItems.length-1; 
				i >= 0; 
				i--
			) {
				for (
					var j = element.groupItems[i].textFrames.length-1; 
					j >= 0; 
					j--
				) {
					// Move paths to the base group and thus remove the intermediate subgroup
					var curPath = element.groupItems[i].textFrames[j];
					curPath.move(element, ElementPlacement.PLACEATEND);
				}
			}
		}
		// Texts as paths
		else {
			// Text objects + callouts
			if (
				element.groupItems.length > 0
				&& element.groupItems[0].compoundPathItems.length > 0
				&& element.groupItems[element.groupItems.length-2].pathItems.length > 0
			) {

				// Move each element of each subgroup to the parent group
				for (
					var i = element.groupItems.length-1; 
					i >= 1; 
					i--
				) {
					for (
						var j = element.groupItems[i].compoundPathItems.length-1; 
						j >= 0; 
						j--
					) {
						// Move paths to the base group and thus remove the intermediate subgroup
						var curPath = element.groupItems[i].compoundPathItems[j];
						curPath.move(element.groupItems[0], ElementPlacement.PLACEATEND);
					}
				}

				// Rename the Layer
				element.groupItems[0].name = "Text";
				element.groupItems[element.groupItems.length-2].name = "Callouts";
			}
			// Only text objects
			else {
				// Move each element of each subgroup to the parent group
				for (
					var i = element.groupItems.length-1; 
					i >= 0; 
					i--
				) {
					for (
						var j = element.groupItems[i].compoundPathItems.length-1; 
						j >= 0; 
						j--
					) {
						// Move paths to the base group and thus remove the intermediate subgroup
						var curPath = element.groupItems[i].compoundPathItems[j];
						curPath.move(element, ElementPlacement.PLACEATEND);
					}
				}
			}
		}
	}
}



function organizeMapLayers(element, qgisMainGroup){
	// Map layer have the name mapName: LayerName
	// Get the name of the map and the name of the layer
	if (element.name.match(/(.+?): (.+)/)) {
		mapName = (element.name.match(/(.+?): (.+)/))[1];
		layerName = (element.name.match(/(.+?): (.+)/))[2];

		// Create the Map group if it doesn't exists
		try {
			qgisMainGroup.groupItems.getByName(mapName);
		}
		catch(e) {
			newGroup = qgisMainGroup.groupItems.add();
			newGroup.name = mapName;
		}

		// Move the layerGroup into the mapGroup
		element.move(qgisMainGroup.groupItems.getByName(mapName), ElementPlacement.PLACEATBEGINNING);
		// Rename the group with the name of the layer
		element.name = layerName;
	}
}


