import './styles.scss'
import PropTypes from 'prop-types'

const Navbar = ({ connection, error }) => {
    return (
        <nav>
            <div className="brand">
                Botanique<span>Tamaire</span>
            </div>

            <div className="right">
                {error && error.length > 0 && (
                    <div className={`badge ${error.color === 'red' ? 'red' : 'yellow'}`}>
                        <p className="fw-600">{error}</p>
                    </div>
                )}
                <div className="connection-status badge">
                    <div className={`dot ${connection?.status ? '' : 'yellow'}`} />
                    {connection?.status ? <p>{connection?.garden}</p> : <p>Connexion en cours</p>}
                </div>
            </div>
        </nav>
    )
}

Navbar.propTypes = {
    connection: PropTypes.object,
    error: PropTypes.string,
}

export default Navbar
