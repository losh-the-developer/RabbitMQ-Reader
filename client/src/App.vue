<template>
  <div id="app">
    <b-navbar bd-highlight fluid type="dark" variant="dark" bg="primary">
      <b-navbar-brand class="m-4 fluid container font-weight-bolder navbar-header-name">{{ queueName }}</b-navbar-brand>

      <!-- Dropdown menu -->
      <b-dropdown right class="m-4">
        <template #button-content>
          Select File <b-icon p-r icon="file-code"></b-icon>
        </template>
        <b-dropdown-item v-for="file in files" :key="file" @click="selectFile(file)">
          {{ file }}
        </b-dropdown-item>
        <b-dropdown-item v-if="files.length === 0" disabled>
          No files available
        </b-dropdown-item>
      </b-dropdown>
    </b-navbar>

    <!-- Message to select a file -->
    <p v-if="files.length > 0 && !selectedFile" class="m-5 text-center text-danger">
      Please select a file to view messages.
    </p>

    <!-- Content when file is selected -->

    <b-container fluid class="m-5" v-if="selectedFile">
      <b-row>
        <b-col><b-table outlined responsive striped hover :items="messageTypeCounts"></b-table></b-col>
        <b-col>
          <GChart
            :type="'PieChart'"
            :options="options"
            :data="chartData"
          />
        </b-col>
      </b-row>
    </b-container>

    <b-container fluid class="m-5" v-if="selectedFile">
      <h1 class="mb-5 mx-auto center" style="text-align: center;">Messages</h1>
      <b-row>
        <template v-for="(messages, messageType) in groupedMessages">
          <b-col :key="messageType" cols="11" class="mb-5">
            <h2>{{ messageType }}</h2>
            <div>
              <b-table striped hover outlined :items="limitMessages(messages)" :fields="getTableFields(messages)" :no-ellipsis="true" class="table-wrap w-auto"></b-table>
            </div>
          </b-col>
        </template>
      </b-row>
    </b-container>

   <!-- Placeholder when no file is selected and no files available -->
   <div v-if="!selectedFile && files.length === 0" class="m-5 text-center text-danger">
      <p>No files available.</p>
    </div>

    
</div>
</template>

<script>
// import messagesObj from './data/messages.json'
import axios from "axios";
import { GChart } from "vue-google-charts/legacy";


export default {
  name: 'App',
  components: {
    GChart,
  },
  data() {
    return {
      files: [],
      selectedFile: null,
      messages: [],
      chartData: [],
      options: {
        width: 800,
        height: 350
      },
      queueName: process.env.VUE_APP_QUEUE_NAME,
    };
  },
  computed: {
      messageTypeCounts() {
        const counts = {};
        this.messages.forEach((message) => {
          const { messageType } = message;
          counts[messageType] = (counts[messageType] || 0) + 1;
        });
        const sortedCounts = Object.keys(counts).map((messageType) => ({
        messageType,
        count: counts[messageType],
        }));

        sortedCounts.sort((a, b) => b.count - a.count); // Sort by count in descending order

        return sortedCounts;
      },

      getChartData() {
        const counts = {};
        this.messages.forEach((message) => {
          const { messageType } = message;
          counts[messageType] = (counts[messageType] || 0) + 1;
        });

        const headerRow = ['Message Type', 'Count'];
        const dataRows = Object.keys(counts).map((messageType) => [
          messageType,
          counts[messageType],
        ]);

        return [headerRow, ...dataRows];
      },

      groupedMessages() {
        const grouped = {};
        this.messages.forEach((message) => {
          const { messageType } = message;
          if (!grouped[messageType]) {
            grouped[messageType] = [];
          }
          grouped[messageType].push(message);
        });
        return grouped;
      },
  },
  created() {
    this.loadFileList();
    console.log('quesue name:', process.env.VUE_APP_QUEUE_NAME)
  },
  methods: {
    async loadFileList() {
      try {
        const context = require.context('../public/messages', false, /\.json$/);
        this.files = context.keys().map(file => file.replace('./', ''));
        console.log('Available files:', this.files);  // Debugging line
      } catch(error) {
        console.error('Failed to load file list:', error);
      }
    },
    async loadFileData() {
      try {
        const filePath = `/messages/${this.selectedFile}`;
        console.log('Loading file:', filePath);  // Debugging line
        const response = await axios.get(filePath);
        this.messages = response.data;
        this.chartData = this.getChartData;
      } catch (error) {
        console.error('Failed to load file data:', error);
      }
    },
    selectFile(file) {
    this.selectedFile = file;
    this.loadFileData();
  },
      getTableFields(messages) {
        const fields = messages.reduce((obj, message) => {
          for (const field in message) {
            if (field !== 'messageType' || field !== 'version' || field !== 'taskToken') {
              obj[field] = true;
            }
          }
          return obj;
        }, {});

        delete fields.messageType;
        delete fields.version;
        delete fields.taskToken;

        return Object.keys(fields);
    },

    limitMessages(messages){
      const limit = 10;
      return messages.slice(0, limit);
    }
  },
  
};
</script>

<style src="./print-styles.css" media="print"></style>
<style>
.container {
  margin-top: 2rem;
}

.table-wrap td {
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
}

.table-container {
  max-width: 1500px; /* Adjust the value to your preferred width */
/* Center the table horizontally */
}

@media print {
    /* Apply specific styles for print media */
    body {
      font-size: 12px; /* Adjust font size for print */
    }
  
    /* Add any additional styles specific to the print layout */
    .table-wrap {
      overflow-x: auto; /* Ensure horizontal scrolling for tables if needed */
    }

    .navbar-header-name{
        text-decoration: underline;
    }
  }
</style>
