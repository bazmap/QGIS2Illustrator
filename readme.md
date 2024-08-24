# QGIS2Illustrator - SVG file importer

## Introduction

This Illustrator script allows you to clean :broom: the exported SVG file from the QGIS Composer when importing it into Adobe Illustrator :ok_hand:

:globe_with_meridians: From a QGIS Project :

![Screenshot of QGIS.](media/qgis_map.png)

:rocket: You have to export a SVG file from the composer :

![Screenshot of the composer of QGIS.](media/composer.png)

:flight_arrival: Using the scipt to import the SVG file, you will have a structurated Illustrator project :
- by maps
- by layer
  - Labels have their own groups including distinct groups for callouts

![Screenshot of the Illustrator project in the test directory.](media/illustrator_project.png)
Note that the provided project contain two :v: imported SVG files.

## Installation
The script can be run on Illustrator in the menu "Files" => "Scripts" => "Other scripts"

If you want it to appear in the scripts list, it have to be placed into the Adobe Illustrator scripts folder (then reboot Illustrator) :
	Example on Windows : _C:\Program Files\Adobe\Adobe Illustrator 20xx\Presets\fr_FR\Scripts_

## QGIS Configuration
:grey_exclamation: The SVG need to be exported from the QGIS composer. Here is some rules, advices and informations :
- You need to check the following option when exporting : "Export map layers as SVG Groups" ("Exporter les couches de la carte comme des groupes SVG" in french)
- You can use the option "Always export text as text objects" ("Toujours exporter les textes en tant qu'objet" in french) to keep the possibility of managing text properties in Illustrator
- Avoid raster layers into you map.
- Strokes and symbols sizes need to be set in point or in millimeter but never in pixel to be the same into Illustrator.
- Stroke styles are kept (join, cap, dash pattern...)
- For surfaces, fill partterns are not correctly managed by the QGIS exporter process : patterns are not clipped.
- For surfaces, shapeburst fill are not supported.
- For surfaces, outlines are managed.

In general, stay simple and do your fancy style into Illustrator :wink:

> [!CAUTION]
> The exporting process adds a lots of background objects as path whithout any stroke, a fill color of black (0,0,0) or white (255,255,255) and a fill opacity of 0%. 
> This last properties (fill opacity) cannot been access within the script, making these backgrounds difficult to detect. But it seems that they always are behind objects groups.  
> The script detects and removes these objects but in case of trouble, you can choose to keep them during the process.

![Screenshot of choosing the objects to remove.](media/illustrator_dialog.png)


## Testing
Open the QGIS Project into the GeoPackage nammed export_illustrator.gpkg

Export the composer "export_illustrator" to SVG file.

Open Illustrator en load the exported file using the JSX script at the root of the project.
=> You will see the data onto your project with the layers structured like in the QGIS document.

