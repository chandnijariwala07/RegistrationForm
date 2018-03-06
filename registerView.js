import React from 'react'
import PropTypes from 'prop-types'
import { reduxForm } from 'redux-form'
import { Link } from 'react-router'
import { push } from 'react-router-redux'
import trackRegistered from 'services/fbTrack'

import { createValidator, required, emailAddress, minLength, match, lowercase, numbers, accept } from 'forms/validation'
import { register, externalLogin, clearRegisterError } from 'redux/actionCreators/account'
import { translate, hasTranslation } from 'services/locale'

import url from 'routes/tokens'
import { Panel, Grid, Row, Col } from 'react-bootstrap'
import Message from 'components/Message/Message'
import TextInput from 'components/TextInput/TextInput'
import CheckboxInput from 'components/CheckboxInput/CheckboxInput'
import ErrorAlert from 'components/ErrorAlert/ErrorAlert'

class RegisterView extends React.Component {
  static propTypes = {
    fields: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    externalLogins: PropTypes.array.isRequired,
    location: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    resetForm: PropTypes.func.isRequired,
    submitting: PropTypes.bool.isRequired,
    invalid: PropTypes.bool,
    error: PropTypes.string
  }

  _renderExternalLogins = (login) => {
    const { fields: {role, tnc, privacy}, submitting } = this.props
    const key = login.name.toLowerCase()
    let logo = key
    switch (logo) {
      case 'facebook':
        logo = 'facebook-official'
        break
      case 'microsoft':
        logo = 'windows'
        break
    }
    return (
      <button key={key} onClick={() => this._handleExternalRegister(login)}
        disabled={submitting || !role.valid || !tnc.valid || (hasTranslation('legal.county.text') && !privacy.valid)}
        className={'btn btn-lg btn-block btn-social btn-' + key}>
        <i className={'fa fa-' + logo} />
        <Message id='account.register.byNetwork' values={{ network: login.name }} />
      </button>
    )
  }

  _handleError = e => { /* noop */ }

  _handleInternalRegister = ({ role, email, password }) => {
    const { dispatch, location: { query } } = this.props
    dispatch(register({ role, email, password }))
      .then(() => query.ref === 'fb' && trackRegistered())
      .then(() => dispatch(push(url.account.registered)))
      .catch(this._handleError)
  }

  _handleExternalRegister = login => {
    const { dispatch, location: { query, state } } = this.props
    window.externalAuthenticationResponse = json => {
      delete window.externalAuthenticationResponse
      dispatch(externalLogin(json.access_token, true))
        .then(() => query.ref === 'fb' && trackRegistered())
        .then(() => dispatch(push((state && state.nextPathname) || url.account.dashboard)))
        .catch(this._handleError)
    }
    window.open(login.url, 'external')
  }

  _createChangeHandlerFor = field => {
    const { dispatch, error } = this.props
    return e => {
      if (error) dispatch(clearRegisterError())
      field.onChange(e)
    }
  }

  render () {
    const {
      fields: { role, email, password, confirm, privacy, tnc, agreement },
      handleSubmit, submitting, externalLogins, error
    } = this.props
    const setRole = r => e => {
      e.preventDefault()
      role.onChange(r)
    }
    return (
      <Grid className='padd-tb-30 view-account-register'>
        <Row>
          <Col sm={6} smOffset={3} lg={4} lgOffset={4}>
            <Panel>

              <Panel.Heading>
                <Panel.Title componentClass='h3'>
                  <Message id='account.register.register' />
                </Panel.Title>
              </Panel.Heading>

              <Panel.Body>
                <form onSubmit={handleSubmit(this._handleInternalRegister)}>

                  <div className='tab-style1 padd-b-20'>
                    <ul className='nav nav-tabs nav-justified'>
                      <li className={role.value === 'jobseeker' && 'active'} role='presentation'>
                        <a href='#jobseeker' aria-controls='jobseeker' role='tab'
                          onClick={setRole('jobseeker')}>
                          <i className='fa fa-user' />
                          <Message id='account.register.jobseeker.header' />
                        </a>
                      </li>
                      <li className={role.value === 'company' && 'active'} role='presentation'>
                        <a href='#company' aria-controls='company' role='tab'
                          onClick={setRole('company')}>
                          <i className='fa fa-industry' />
                          <Message id='account.register.company.header' />
                        </a>
                      </li>
                    </ul>
                  </div>

                  {role.valid &&
                  <div>
                    <CheckboxInput field={privacy} disabled={submitting}
                      onChange={this._createChangeHandlerFor(privacy)}
                      label={<span>
                        <Message id='legal.privacy.link-pre' />
                        {' '}
                        <Link to={url.legal + '/privacy'} target='_legal'>
                          <Message id='legal.privacy.link' />
                        </Link>
                        {' '}
                        <Message id='legal.privacy.link-post' />
                      </span>} />

                    <CheckboxInput field={tnc} disabled={submitting}
                      onChange={this._createChangeHandlerFor(tnc)}
                      label={<span>
                        <Message id={`legal.toc-${role.value}.link-pre`} />
                        {' '}
                        <Link to={`${url.legal}/toc-${role.value}`} target='_legal'>
                          <Message id={`legal.toc-${role.value}.link`} />
                        </Link>
                        {' '}
                        <Message id={`legal.toc-${role.value}.link-post`} />
                      </span>} />

                    {role.value === 'jobseeker' &&
                      <CheckboxInput field={agreement} disabled={submitting}
                        onChange={this._createChangeHandlerFor(agreement)}
                        label={<span>
                          <Message id='legal.agreement.link-pre' />
                          {' '}
                          <Link to={url.legal + '/agreement'} target='_legal'>
                            <Message id='legal.agreement.link' />
                          </Link>
                          {' '}
                          <Message id='legal.agreement.link-post' />
                        </span>} />
                    }

                    <TextInput field={email} disabled={submitting}
                      onChange={this._createChangeHandlerFor(email)}
                      label={<Message id='account.field.email.label' />} />

                    <TextInput field={password} type='password' disabled={submitting}
                      onChange={this._createChangeHandlerFor(password)}
                      label={<Message id='account.field.password.label' />} />

                    <TextInput field={confirm} type='password' disabled={submitting}
                      onChange={this._createChangeHandlerFor(confirm)}
                      label={<Message id='account.field.passwordConfirmation.label' />} />

                    <button
                      className='btn btn-theme btn-block btn-lg btn-email btn-social'
                      disabled={submitting}>
                      <i className='fa fa-envelope' /> <Message id='account.register.register' />
                    </button>

                    {!externalLogins.length || role.value !== 'jobseeker' ||
                      <div className='alternative'><Message id='general.or' /></div>}
                    {role.value !== 'jobseeker' || externalLogins.map(this._renderExternalLogins)}

                    <ErrorAlert error={error} />
                  </div>
                  }
                </form>
              </Panel.Body>

              <Panel.Footer>
                <Message id='account.register.panel-already-registered-1' />
                <Link to={url.account.login}><Message id='general.login' /></Link>
                <Message id='account.register.panel-already-registered-2' />
              </Panel.Footer>
            </Panel>
          </Col>
        </Row>
      </Grid>
    )
  }
}

const config = {
  form: 'RegisterForm',
  fields: ['role', 'email', 'password', 'confirm', 'privacy', 'tnc', 'agreement'],
  validate: createValidator({
    role: required(),
    email: [required(), emailAddress()],
    password: [required(), minLength(6), lowercase(), numbers()],
    confirm: match('password'),
    privacy: accept(),
    tnc: accept(),
    agreement: (value, values) => {
      if (values.role === 'jobseeker' && !value) {
        return translate('field.error.accept')
      }
    }
  })
}

const mapStateToProps = (state, ownProps) => ({
  initialValues: {
    role: ownProps.location.query.ref === 'fb' ? 'jobseeker' : '',
    email: '',
    password: '',
    confirm: '',
    tnc: false,
    privacy: false,
    agreement: false
  },
  locale: state.i18n.locale,
  externalLogins: state.masterData.externalLogins || [],
  message: state.account.register.error
})

export default reduxForm(config, mapStateToProps)(RegisterView)
