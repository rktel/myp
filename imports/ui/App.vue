<template>
<v-app id="inspire" dark>
    <v-toolbar app fixed clipped-left>
        <v-toolbar-title>Generador de Reportes</v-toolbar-title>
    </v-toolbar>

    <v-content>
        <v-container fluid fill-height>
          
            <v-layout justify-center align-center>
                   <v-flex shrink xs12 sm8 md6>

                    <section>
                        <v-combobox v-model="select" :items="items" label="Seleccione unidades [6 como maximo]" multiple></v-combobox>
                    </section>
                    <section>
                        <v-menu ref="menuDS" :close-on-content-click="false" v-model="pickerDS" :nudge-right="40" :return-value.sync="dateStart" lazy transition="scale-transition" offset-y min-width="290px">
                            <v-text-field slot="activator" v-model="dateStart" label="Fecha de Inicio" prepend-icon="event" readonly></v-text-field>
                            <v-date-picker v-model="dateStart" @input="$refs.menuDS.save(dateStart)"></v-date-picker>
                        </v-menu>
                        <v-menu ref="menuTS" :close-on-content-click="false" v-model="pickerTS" :nudge-right="40" :return-value.sync="timeStart" lazy transition="scale-transition" offset-y max-width="290px" min-width="290px">
                            <v-text-field slot="activator" v-model="timeStart" label="Tiempo de Inicio" prepend-icon="access_time" readonly> </v-text-field>
                            <v-time-picker v-if="pickerTS" v-model="timeStart" @change="$refs.menuTS.save(timeStart)" format="24hr"> </v-time-picker>
                        </v-menu>
                    </section>
                    <section>
                        <v-menu ref="menuDE" :close-on-content-click="false" v-model="pickerDE" :nudge-right="40" :return-value.sync="dateEnd" lazy transition="scale-transition" offset-y min-width="290px">
                            <v-text-field slot="activator" v-model="dateEnd" label="Fecha de Termino" prepend-icon="event" readonly></v-text-field>
                            <v-date-picker v-model="dateEnd" @input="$refs.menuDE.save(dateEnd)"></v-date-picker>
                        </v-menu>
                        <v-menu ref="menuTE" :close-on-content-click="false" v-model="pickerTE" :nudge-right="40" :return-value.sync="timeEnd" lazy transition="scale-transition" offset-y max-width="290px" min-width="290px">
                            <v-text-field slot="activator" v-model="timeEnd" label="Tiempo de Termino" prepend-icon="access_time" readonly> </v-text-field>
                            <v-time-picker v-if="pickerTE" v-model="timeEnd" @change="$refs.menuTE.save(timeEnd)" format="24hr"> </v-time-picker>
                        </v-menu>
                    </section>
                    <section>
                        <v-btn color="primary" block @click="generarReporte(select, dateStart, timeStart, dateEnd, timeEnd)" :disabled="buttonGRDisabled">Generar Reporte</v-btn>
                    </section>
                    <section>
                           <v-progress-linear v-if="progressState == 1" :indeterminate="true" color="green"></v-progress-linear>
                    </section>
    <v-snackbar v-model="snackbar" :right="true" :timeout="timeout" :top="true">
      {{ snackbarText }}
      <v-btn color="pink" flat  @click="snackbar = false">Cerrar</v-btn>
    </v-snackbar>
                </v-flex>
            </v-layout>
        </v-container>
    </v-content>
    <v-footer app fixed>
        <span>SecuritasPeru&copy;2018</span>
    </v-footer>
</v-app>
</template>

<script>
import { Plates } from "../api/collections";
import { streamer } from "../api/streamers";
import { json2excel } from "js2excel";

const SECONDS = ":00";

const DAYS = 2;
const UNIDADES = 6;


export default {
  data() {
    return {
      select: [],
      dateStart: null,
      dateEnd: null,
      timeStart: null,
      timeEnd: null,
      pickerDS: false,
      pickerDE: false,
      pickerTS: false,
      pickerTE: false,
      buttonGRDisabled: false, // TRUE PARA DESHABILITAR
      progressState: 0,
      snackbar: false,
      timeout: 6000,
      snackbarText: null,
      userID: new Date().getTime()
    };
  },
  meteor: {
    $subscribe: {
      plates: []
    },
    plates() {
      return Plates.find({});
    }
  },
  methods: {
    // allowedDates: val => parseInt(val.split("-")[2], 10) <= moment().date(),
    generarReporte(selectedPlates, dateStart, timeStart, dateEnd, timeEnd) {
      if (
        dateStart &&
        timeStart &&
        dateEnd &&
        timeEnd &&
        selectedPlates.length > 0
      ) {
        const dateTimeStart = dateStart + " " + timeStart + SECONDS;
        const dateTimeEnd = dateEnd + " " + timeEnd + SECONDS;

        // console.log(selectedPlates, dateTimeStart, dateTimeEnd);
        if (selectedPlates.length > 0 && selectedPlates.length <= 6) {
          const stringPlates = selectedPlates.join(",");

          const DTStart = stringToDateTime(dateTimeStart);
          const DTEnd = stringToDateTime(dateTimeEnd);
          // console.log(DTStart, DTEnd)
          const diffDays = getDaysDiff(DTEnd, DTStart);
          // console.log('days:',diff)
          if (diffDays >= 0 && diffDays <= DAYS) {
            console.log("OK");
            this.snackbar = true;
            this.snackbarText = "Iniciando proceso...";
            this.buttonGRDisabled = true;
            this.progressState = 1;
            Meteor.call(
              "getReport",
              this.userID,
              stringPlates,
              dateTimeStart,
              dateTimeEnd
            );
          } else {
            console.log( `Son ${DAYS} dias como maximo` );
            this.snackbar = true;
            this.snackbarText = `Son ${DAYS} dias como maximo`;
          }
        } else {
          console.log(`Maximo ${UNIDADES} unidades`);
          this.snackbar = true;
          this.snackbarText = `Son ${UNIDADES} unidades como maximo`;
        }
      } else {
        console.log("Debe llenar los campos");
        this.snackbar = true;
        this.snackbarText = "Debe rellenar todos los campos";
      }
    }
  },
  computed: {
    items: function() {
      if (this.$subReady.plates) {
        return this.plates[0].plates.filter(plate => plate!='V9M725');
      } else {
        return [];
      }
    }
  },
  mounted() {
    this.snackbar = true;
    this.snackbarText = "Bienvenido";
    streamer.on("Rows", (userID, data) => {
      // console.log(data);
      if (userID == this.userID) {
        this.buttonGRDisabled = false;
        this.progressState = 0;

        try {
          json2excel({
            data,
            name: "Reporte",
            formateDate: "yyyy/mm/dd"
          });
        } catch (e) {
          console.error("export error");
        }
      }
    });
    streamer.on("NoData", (userID, value) => {
      if (userID == this.userID) {
        this.buttonGRDisabled = false;
        this.progressState = 0;
        console.log(value);
        this.snackbar = true;
        this.snackbarText = "No hay data";
      }
    });
  }
};

function getDaysDiff(dateTimeMax, dateTimeMin) {
  const diff = getTimeMillis(dateTimeMax) - getTimeMillis(dateTimeMin);
  return parseInt(diff / (24 * 60 * 60 * 1000));
}

function stringToDateTime(data) {
  const splitSpace = data.split(" ");
  const date = splitSpace[0];
  const time = splitSpace[1];
  const splitDate = date.split("-");
  const splitTime = time.split(":");
  const preMillis = new Date(
    splitDate[0],
    parseInt(splitDate[1]) - 1,
    splitDate[2],
    splitTime[0],
    splitTime[1],
    splitTime[2]
  ).getTime();
  const millis = preMillis;

  return new Date(millis);
}

function getTimeMillis(dateTime) {
  return new Date(dateTime).getTime();
}
</script>

<style>
</style>
