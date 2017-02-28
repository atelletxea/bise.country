""" Share a country with a group or user
"""

from plone.directives import form
from z3c.form import button
from z3c.form.interfaces import ActionExecutionError
from zope import schema
from zope.component import getMultiAdapter
from zope.component.hooks import getSite
from zope.interface import Invalid, Interface, implements
from zope.schema.vocabulary import SimpleVocabulary
import logging

logger = logging.getLogger('bise.country')


ROLES = {
    u'Country representative': 'country_rep',
    u'ETC representative': 'etc_rep',
    u'EEA representative': 'eea_rep'
}.items()

PLONE_ROLES = {
    'country_rep': 'Contributor',
    'etc_rep': 'Editor',
    'eea_rep': 'Reviewer',
}


class IShareSchema(form.Schema):
    """ Schema used for sharing form
    """

    principal_id = schema.TextLine(title=u"Username or Group id",
                                   required=True)

    role_id = schema.Choice(
        title=u"Role",
        vocabulary=SimpleVocabulary.fromItems(ROLES)
    )


class MultipleResultsException(Exception):
    """ Too many results found, we only need one
    """


class NoResultsException(Exception):
    """ No results found, we need at least one
    """


class ICheckoutSharePage(Interface):
    """ Marker interface for share page
    """


class ShareForm(form.SchemaForm):
    """ A page to share a country with a group or user
    """
    implements(ICheckoutSharePage)

    schema = IShareSchema
    ignoreContext = True

    label = u"Share this country for checkout editing"
    description = u"""Here it is possible to choose the Eionet groups or
individual users that have special checkout, edit and reviewing rights in this
location."""

    @button.buttonAndHandler(u"Save")
    def handleApply(self, action):
        data, errors = self.extractData()
        if errors:
            self.status = self.formErrorsMessage
            return

        principal_id = data['principal_id']
        role = PLONE_ROLES[data['role_id']]

        try:
            principal = self._search_principal(principal_id)
        except NoResultsException:
            msg = u'No results found.'
            raise ActionExecutionError(Invalid(msg))
        except MultipleResultsException:
            msg = 'The user/group id is not precise enough.'
            raise ActionExecutionError(Invalid(msg))

        self.status = u"Saved."

        self.share_with_principal(principal['id'], role)

    @button.buttonAndHandler(u"Cancel")
    def handleCancel(self, action):
        return self.request.response.redirect(self.context.absolute_url())

    def share_with_principal(self, principal_id, role):
        """ Setup proper share role for this principal
        """
        logger.info("Setting up proper %s role for %s", role, principal_id)
        print "Sharing", principal_id, role

        site = getSite()
        checkout_folder = site['checkout-folder']
        for folder in [checkout_folder, self.context]:
            self.assign_role_to_principal(folder, role, principal_id)

    def assign_role_to_principal(self, context, role, principal_id):
        roles = set(context.get_local_roles_for_userid(userid=principal_id))
        roles.add(role)
        roles = list(roles)
        context.manage_setLocalRoles(principal_id, roles)

    def _search_principal(self, term):
        search = getMultiAdapter((self.context, self.request),
                                 name='pas_search')
        users = search.searchUsers(id=term)
        groups = search.searchGroups(id=term)

        result = users + groups
        if len(result) > 1:
            raise MultipleResultsException
        if len(result) == 0:
            raise NoResultsException

        return result[0]
