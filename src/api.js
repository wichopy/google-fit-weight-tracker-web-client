import React from 'react'
import * as dataParser from './dataParser'

export default class API {
  clientID = '117622503236-k4ap9icujnjmfct4p19cg3shci9slu85.apps.googleusercontent.com'
  jsclientURL = 'https://apis.google.com/js/api.js'
  discoveryDocs = [
    'https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest',
  ]
  scopes = 'https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.body.write email profile openid'

  initApi = ({
    onReady,
    onSignIn,
    onSignOut,
  }) => {
    this.onReady = onReady
    this.onSignIn = onSignIn
    this.onSignOut = onSignOut
    this.loadScript(this.jsclientURL)
      .then(() => {
        console.log('script loaded')
        window.gapi.load('client', this.initClient)
      })
  }

  loadScript = (src) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    const promise = new Promise((resolve, reject) => {
      script.addEventListener('load', () => resolve(src));
      script.addEventListener('error', e => reject(e));
    }).catch(e => {
      throw e;
    });

    document.body.appendChild(script);

    return promise;
  };

  initClient = () => {
    console.log('start init client')
    window.gapi.client.init({
      discoveryDocs: this.discoveryDocs,
      clientId: this.clientID,
      scope: this.scopes,
    }).then(res => {
      console.log('init client complete')

      window.gapi.auth2.getAuthInstance().isSignedIn.listen((isSignedIn) => {
        console.log('Sign in status change,', isSignedIn)
        if (isSignedIn) {
          this.setUserLoggedOn()
        } else {
          this.setUserLoggedOff()
        }
      });

      console.log('check if authorized already.')
      if (window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
        this.setUserLoggedOn()
      }

      this.onReady()
    })
  }

  setUserLoggedOn = () => {
    const authResponse = window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse(true)
    console.log('User response to state', authResponse)
    this.onSignIn(authResponse)
  }

  setUserLoggedOff = () => {
    console.log('user Signed off')
    this.onSignOut()
  }


  signIn = () => {
    window.gapi.auth2.getAuthInstance().signIn()
  }

  signOut = () => {
    window.gapi.auth2.getAuthInstance().signOut()
    this.setUserLoggedOff()
  }

  request = ({ path, body, method }) => window.gapi.client.request(
    {
      path,
      body,
      method,
    }
  )

  getAvailableDataSources = () => {
    return this.request({
      path: 'fitness/v1/users/me/dataSources',
      method: 'GET'
    })
  }

  getBodyWeights = ({
    startTimeMillis, endTimeMillis, bucketByMillis,
  }) => {
    // Find more data source IDs at https://developers.google.com/apis-explorer/#search/fitness.users.datasources.list/m/fitness/v1/fitness.users.dataSources.list
    const dataSourceId = 'derived:com.google.weight:com.google.android.gms:merge_weight'

    const requestBody = {
      aggregateBy: [
        {
          dataSourceId,
        },
      ],
      bucketByTime: {
        durationMillis: bucketByMillis,
      },
      endTimeMillis,
      startTimeMillis,
    }

    return this.request({
      path: 'fitness/v1/users/me/dataset:aggregate',
      body: requestBody,
      method: 'POST',
    }).then(res => {
      console.log(res)
      return res.result
    })
  }
}

const ApiContext = React.createContext('api')

export class ApiProvider extends React.Component {
  state = {
    ready: false,
    loading: true,
    authorized: false,
    authResponse: null,

    signIn: () => {
      this.setState({
        loading: true,
      })
      this.props.api.signIn()
    },

    signOut: () => {
      this.setState({
        loading: true,
      })
      this.props.api.signOut()
    },

    getAvailableDataSources: () => {
      this.setState({
        loading: true
      })

      return this.props.api.getAvailableDataSources().then(res => {
        this.setState({ loading: false })
      }).catch(err => {
        this.setState({ loading: false })
        throw err
      })
    },

    getBodyWeights: (duration) => {
      this.setState({
        loading: true,
      })

      let bucketByMillis
      const endTimeMillis = new Date().getTime();
      let startTimeMillis
      switch (duration) {
        case 'hourly':
          bucketByMillis = 1000 * 60 * 60
          const dayInMillis = 1000 * 60 * 60 * 24
          startTimeMillis = endTimeMillis - dayInMillis;
          break;
        case 'weekly':
          bucketByMillis = 1000 * 60 * 60 * 24 * 7
          const threeMonthsInMillis = 1000 * 60 * 60 * 24 * 30 * 3
          startTimeMillis = endTimeMillis - threeMonthsInMillis;
          break;
        default:
          // case 'daily':
          const weekInMillis = 1000 * 60 * 60 * 24 * 7
          startTimeMillis = endTimeMillis - weekInMillis;
          bucketByMillis = 1000 * 60 * 60 * 24
      }

      return this.props.api.getBodyWeights({
        startTimeMillis,
        endTimeMillis,
        bucketByMillis,
      }).then(res => {
        this.setState({ loading: false })
        console.log(res)
        return {
          start: startTimeMillis,
          end: endTimeMillis,
          points: dataParser.extractWeightPoints(res)
        }
      }).catch(err => {
        this.setState({ loading: false })
        return {
          start: startTimeMillis,
          end: endTimeMillis,
          points: [],
        }
        // An empty response is an error for some reason, ignore errors.
        // throw err
      })
    },

    addBodyWeight: (params) => {
      this.setState({
        loading: true,
      })

      return this.props.api.addBodyWeight(params).then(res => {
        console.log(res)
        this.setState({ loading: false })
      })
    }
  }

  componentDidMount() {
    console.log('component loaded')
    this.props.api.initApi({
      onReady: () => this.setState({ loading: false, ready: true }),
      onSignIn: (authResponse) => this.setState({
        authorized: true,
        authResponse,
        loading: false,
      }),
      onSignOut: () => this.setState({
        authorized: false,
        authResponse: null,
        loading: false,
      })
    })
  }

  render() {
    return <ApiContext.Provider value={this.state}>
      {this.props.children}
    </ApiContext.Provider>
  }
}


export const withApi = Component => function WrappedComponent(props) {
  return <ApiContext.Consumer>
    {
      value => <Component {...value} {...props} />
    }
  </ApiContext.Consumer>
}