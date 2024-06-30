import { Cognite3DViewer, CognitePointCloudModel, AnnotationIdPointCloudObjectCollection, Image360Annotation, PointCloudIntersection} from '@cognite/reveal';
import * as THREE from 'three';
import { CogniteClient, AnnotationData, AnnotationsObjectDetection,AnnotationsCogniteAnnotationTypesImagesAssetLink,AnnotationsBoundingVolume, SetField, AnnotationUpdate, } from '@cognite/sdk';
import * as dat from 'dat.gui';
import { Image360UI } from './Image360UI';
import { merge } from 'lodash';


interface Box {
  matrix: number[];
}

interface AnnotationRegion {
  box: Box;
}

interface Annotation {
  annotatedResourceType: string;
  annotatedResourceId: number;
  annotationType: string;
  creatingApp: string;
  creatingAppVersion: string;
  creatingUser: string;
  data: AnnotationData;
  id: number;
  status: string;
}

export async function getBoxGroup(client: CogniteClient, pointCloudModel: CognitePointCloudModel, viewer: Cognite3DViewer, anResourceType: string, anResourceIds: { id: number }[]): Promise<void> {
  const response = await client.annotations.list({
    limit: 100,
    filter: {
      annotatedResourceType: 'threedmodel',
      annotatedResourceIds: anResourceIds,
      status: 'approved',
    },
  });
  const annotations = response.items as Annotation[];
  // Traverse stylable objects and add boxes for approved annotations
  const annotationIds: number[] = annotations.map(annotation => annotation.id);
  console.log(`Approved annotation ids:`, annotationIds); // Debug log
  // Traverse stylable objects and add boxes for the annotations
  pointCloudModel.traverseStylableObjects(obj => {
    if (annotationIds.includes(obj.annotationId)) {
      const boundingBox = new THREE.Box3(
        obj.boundingBox.min.clone(),
        obj.boundingBox.max.clone()
      );
      console.log("Bounding box:", boundingBox); // Debug log
      const boxHelper = new THREE.Box3Helper(boundingBox, new THREE.Color(0xff0000)); // Red color for the bounding box
      viewer.addObject3D(boxHelper);
    }
  });

  const objectCollection = new AnnotationIdPointCloudObjectCollection(annotationIds);
  const appearance = { color: new THREE.Color(0, 1, 0) }; // Green color for styling
  pointCloudModel.assignStyledObjectCollection(objectCollection, appearance);
  };


export class AnnotationMatcherUI{
  constructor(viewer: Cognite3DViewer, gui: dat.GUI, image360Ui: Image360UI, client: CogniteClient, pointCloudModel: CognitePointCloudModel){
    const state = {
      visible: true,
      color: '#ffffff',
    };

    const params = {
      matchAnnotations: () => { this.matchAnnotations(image360Ui, client, pointCloudModel, viewer); },
      toggleAnnotatedImages: () => {this.toggleAnnotatedImages(image360Ui);}
    };
    gui.add(params, 'matchAnnotations').name('Match annotations');
    gui.add(params, 'toggleAnnotatedImages').name('Toggle annotated images');

    gui.add(state, 'visible').name('Visible');

    gui.addColor(state, 'color').name('Color');
  }
  private async matchAnnotations(image360Ui: Image360UI, client: CogniteClient, pointCloudModel: CognitePointCloudModel, viewer: Cognite3DViewer) {
    const pointCloudBoundingBoxes = this.getPointCloudBoundingBoxes(pointCloudModel);
    console.log("Matching annotations");
    if (image360Ui.selectedEntity !== undefined){
      const image360 = image360Ui.selectedEntity;
      const imageannotations = await image360.getActiveRevision().getAnnotations();
      console.log('Annotations:', imageannotations);
      const imageBoundingBoxes = this.getImageBoundingBoxes(imageannotations);

      console.log("PC-BBOXES:",pointCloudBoundingBoxes);
      viewer.on("click", async event => {
        const {offsetX, offsetY} = event;
        const intersection = await viewer.getIntersectionFromPixel(offsetX, offsetY);
        if (intersection !== null) {
          if (intersection.type === 'pointcloud') {
            await mergeannotations(image360Ui, intersection, client);
            if (intersection.annotationId !== 0){
              const selected = new AnnotationIdPointCloudObjectCollection([intersection.annotationId]);
              pointCloudModel.assignStyledObjectCollection(selected, { color: new THREE.Color(0x05a8ff) });
            }
     

          return;}
        };
        
      
      });
    }
    else{
      console.log('No image selected');
    }
  };
  public toggleAnnotatedImages(image360Ui: Image360UI){
    image360Ui.toggleAnnotatedImages();
  }
  private getPointCloudBoundingBoxes(pointCloudModel: CognitePointCloudModel): THREE.Box3[] {
    const boundingBoxes: THREE.Box3[] = [];
    pointCloudModel.traverseStylableObjects(object => {
      boundingBoxes.push(object.boundingBox.clone());
    });
    return boundingBoxes;
  }

  private getImageBoundingBoxes(annotations: Image360Annotation[] ): THREE.Box3[] {
    const boundingBoxes: THREE.Box3[] = [];
    let bbox;
    annotations.forEach(annotation => {
      const annotationData = annotation.annotation.data as AnnotationData
      console.log("Annotation Data:", annotationData);
      if ((annotationData as AnnotationsObjectDetection).boundingBox){
        const abbox = (annotationData as AnnotationsObjectDetection).boundingBox;
        if (abbox !== undefined){
          bbox = new THREE.Box3(
            new THREE.Vector3(abbox.xMin, abbox.yMin),
            new THREE.Vector3(abbox.xMax, abbox.yMax)
          );
        }
      }
      if ((annotationData as AnnotationsCogniteAnnotationTypesImagesAssetLink)){

      }
    });
    return boundingBoxes;
  }
}

async function mergeannotations(imageannotation: Image360UI, intersection: PointCloudIntersection, client: CogniteClient){
  //const imgAnnotation = imageannotation.annotation;
  const pCloudAnnotationId = intersection.annotationId;
  const selectedimageAnnotation = imageannotation.selectedEntity?.getActiveRevision().getAnnotations();
  if (!selectedimageAnnotation) {
    console.error('No selected image annotation found');
    return;
  }
  const imageAnnotation = await selectedimageAnnotation;
  if (intersection.assetRef == undefined){
    //Constants from image
    const imageAnnotationData = imageAnnotation[0].annotation.data as AnnotationsCogniteAnnotationTypesImagesAssetLink;
    const imageAssetId = imageAnnotationData.assetRef.id;
    // Point Cloud Annotation:
    const pCloudAnnotation = await client.annotations.retrieve([{id: pCloudAnnotationId}]);
    const pCloudAnnotationData = pCloudAnnotation[0].data as AnnotationsBoundingVolume;
    console.log('Point Cloud Annotation Data:', pCloudAnnotationData);
    
    const newdata = {} as SetField<AnnotationsBoundingVolume>;
    newdata.set = {
      assetRef: {
        id: imageAssetId,
      },
      region: pCloudAnnotationData.region,
    }; 
    const annotation_update: AnnotationUpdate = {
      update: {
          annotationType: { set: 'pointcloud.BoundingVolume' },
          data: newdata,
          status: { set: "approved" },

      }
    };
    
    const annotationChanges = [
      {
        id: pCloudAnnotationId,
        update: annotation_update.update,
      },
    ];
    const updateres = await client.annotations.update(annotationChanges);
    console.log('The bounding volume was updated on click!', updateres);
  
  }
    
}