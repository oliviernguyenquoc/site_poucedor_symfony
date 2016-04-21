<?php

namespace Pouce\UserBundle\Controller;

use FOS\RestBundle\Controller\Annotations\View;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;

class UserRestController extends Controller
{
	/**
	 * @ApiDoc(
	 *   resource = true,
	 *   description = "Get informations on a User with the id",
	 * )
	 */
	public function getUserAction($id){
		$user = $this->getDoctrine()->getRepository('PouceUserBundle:User')->findOneBy(array('id' => $id));
		if(!is_object($user)){
			throw $this->createNotFoundException();
		}

		return array(
			'first name' 	=> $user->getFirstName(),
			'last name' 	=> $user->getLastName(),
			'sex'			=> $user->getSex(),
			'promotion'		=> $user->getPromotion(),
			'telephone' 	=> $user->getTelephone(),
			'school' 		=> array(
				'name' 		=> $user->getSchool()->getName(),
				'sigle'		=> $user->getSchool()->getSigle(),
				'address'	=> $user->getSchool()->getAddress(),
				'city'		=> $user->getSchool()->getCity()->getName()
			)
		);
	}
}
