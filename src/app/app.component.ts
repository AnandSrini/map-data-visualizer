import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tileLayer, latLng, Map } from 'leaflet';
import * as L from 'leaflet';
import { isDefined } from '@angular/compiler/src/util';
import { isString } from 'util';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'animal-casualties';
  mapInstance: Map;
  originalFeatureCollection: any = {
    type: 'FeatureCollection',
    features: []
  };
  options = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      })
    ],
    zoom: 5,
    center: latLng([ 22.397307, 78.482909 ])
  };

  currentLayer = null;
  selectedAnimalType = 'All';
  selectedInfrastructureType = 'All';
  selectedState = 'All';

  constructor(private http: HttpClient) {


  }

  onMapReady(map: Map) {
    this.mapInstance = map;

  const featureCollection = {
    type: 'FeatureCollection',
    features: []
  };

    this.http.get('assets/LinearInfrastructure.json').subscribe((response: AnimalCasualtyDetail[]) => {
      response.forEach((record) => {
        if (record.Latitude && record.Longitude && record.Latitude !== 9999 && record.Longitude !== 9999) {
          if (!isNaN(record.Latitude) && !isNaN(record.Longitude) && isString(record.State)) {
            featureCollection.features.push({
              type: 'Feature',
              properties: {
                ...record
              },
              geometry: {
                type: 'Point',
                coordinates: [record.Longitude, record.Latitude]
              }
            });
          }
        }
      });
      this.originalFeatureCollection = featureCollection;
      this.addFeatureCollection((featureCollection));
      this.addMapFilterControl();
      this.addMapLegend();
    });
  }

  addMapFilterControl() {
    const leaflet: any = L;
    const legend = leaflet.control({ position: 'topleft' });
    legend.onAdd = (map) => {
      const div: any = L.DomUtil.create('div', 'legend-container');
      div.innerHTML = `Animal: <select class="animal-filter">
                          <option value="All">All</option>
                          <option value="Elephant">Elephant</option>
                          <option value="Leopard">Leopard</option>
                          <option value="Lion">Lion</option>
                          <option value="Tiger">Tiger</option>
                          <option value="Other">Others</option>
                          <option value="n.a">NA</option>
                        </select><br><br>
                        Infrastructure: <select class="infra-filter">
                          <option value="All">All</option>
                          <option value="Railway">Railway</option>
                          <option value="Electric">Electric</option>
                          <option value="Road">Road</option>
                          <option value="Canal">Canal</option>
                        </select>`;
      const animalFilterElement = div.getElementsByClassName('animal-filter')[0];
      animalFilterElement.onmousedown = animalFilterElement.ondblclick = L.DomEvent.stopPropagation;

      const infraFilterElement = div.getElementsByClassName('infra-filter')[0];
      infraFilterElement.onmousedown = infraFilterElement.ondblclick = L.DomEvent.stopPropagation;
      animalFilterElement.onchange = (event) => {
        this.filterDataBased('Animal', event.target.value);
      };
      infraFilterElement.onchange = (event) => {
        this.filterDataBased('Infrastructure', event.target.value);
      };
      return div;
    };
    legend.addTo(this.mapInstance);
  }

  addMapLegend() {
    const leaflet: any = L;
    const legend = leaflet.control({ position: 'topleft' });
    legend.onAdd = function (map) {
      const div: any = L.DomUtil.create('div', 'info legend');
      div.innerHTML = `
      <div class="legend-container">
        <div class="legend-div"><span class="dot elephant"></span>Elephant</div>
        <div class="legend-div"><span class="dot leopard"></span>Leopard</div>
        <div class="legend-div"><span class="dot lion"></span>Lion</div>
        <div class="legend-div"><span class="dot tiger"></span>Tiger</div>
        <div class="legend-div"><span class="dot mutiple"></span>Mutiple</div>
        <div class="legend-div"><span class="dot others"></span>Others</div>
      </div>
      `;
      div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
      return div;
    };
    legend.addTo(this.mapInstance);
  }

  filterDataBased(valueType: string, selectedValue: string) {
    switch (valueType) {
      case 'Animal':
        this.selectedAnimalType = selectedValue;
        break;
      case 'Infrastructure':
        this.selectedInfrastructureType = selectedValue;
        break;
      case 'State':
        this.selectedState = selectedValue;
        break;
    }
    this.mapInstance.removeLayer(this.currentLayer);
    const layerConfig: any = {
      pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 8,
            fillColor: this.getColor(feature.properties.AnimalTypeGeneral),
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });
      },
      onEachFeature: this.onEachFeature
    };
    layerConfig.filter = (feature) => {
      return feature.properties.AnimalTypeGeneral.includes(this.selectedAnimalType !== 'All' ? this.selectedAnimalType : '') &&
      // tslint:disable-next-line:max-line-length
      feature.properties.LinearInfrastructureType.includes(this.selectedInfrastructureType !== 'All' ? this.selectedInfrastructureType : '') &&
      feature.properties.State.includes(this.selectedState !== 'All' ? this.selectedState : '');
    };
    this.currentLayer = L.geoJSON(this.originalFeatureCollection, layerConfig).addTo(this.mapInstance);
  }

  onEachFeature(feature, layer) {
    layer.on({
        click: () => {
          layer.bindPopup(`
          <h1> AnimalType: ${feature.properties.AnimalTypeGeneral}  </h1>
          <h2> Infrastructure: ${feature.properties.LinearInfrastructureType} </h2>
          <h3> ${feature.properties.ShortHeading} </h3>
          <div>
            <a href="${feature.properties.Source}" target="_blank">Source link</a>
          </div>
          `).openPopup();
        }
    });
  }

  addFeatureCollection (featureCollection) {
    console.log(featureCollection);
   this.currentLayer = L.geoJSON(featureCollection, {
      pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 8,
            fillColor: this.getColor(feature.properties.AnimalTypeGeneral),
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });
      },
      onEachFeature: this.onEachFeature
    }).addTo(this.mapInstance);
  }

  getColor(animalType: string) {
    if (animalType) {
      if (animalType.includes(',')) {
        return 'red';
      } else if (animalType.includes('Elephant')) {
        return '#808080';
      } else if (animalType.includes('Leopard')) {
        return '#d6952d'; // orange
      } else if (animalType.includes('Lion')) {
        return 'yellow';
      } else if (animalType.includes('Tiger')) {
        return '#d6572d'; // reddish orange
      } else if (animalType.includes('Other')) {
        return 'pink';
      } else if (animalType.includes('n.a')) {
        return 'black';
      }
    } else {
      return 'green';
    }
  }

}
