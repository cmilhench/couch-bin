module.exports = {
  couch: {
  	cradle: {
  		options: {
		    host: "localhost",
				cache: true,
				raw: false,
        auth: { username: process.env.COUCH_USER, password: process.env.COUCH_PASSWORD }
			}
		},
	  db: {
	  	'requests': {
	  		designs: {
	  			'traffic': {
		  			views: {
							by_url: {
								map: function(doc){
		              var timestamp = new Date(doc.timestamp);
									emit([
										doc.url,
										doc.method,
		                timestamp.getFullYear(), 
		                timestamp.getMonth() + 1, 
		                timestamp.getDate(), 
		                timestamp.getHours(), 
		                timestamp.getMinutes(), 
		                timestamp.getSeconds()], 1)
								},
								reduce: '_sum'
							}
	        	}
	        }
      	}
      }
		}
	}
}